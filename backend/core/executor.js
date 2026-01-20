/**
 * Code Executor
 * Compiles and runs generated code to verify transpilation correctness
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class Executor {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'transpiler-temp');
    this.timeout = 10000; // 10 second timeout
  }

  /**
   * Initialize temp directory
   */
  async init() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create temp directory:', err);
    }
  }

  /**
   * Execute Python code
   */
  async executePython(code) {
    const filename = path.join(this.tempDir, `temp_${Date.now()}.py`);

    try {
      // Write code to file
      await fs.writeFile(filename, code);

      // Execute with Python
      const result = await this.runCommand(`python3 ${filename}`, this.timeout);

      // Cleanup
      await fs.unlink(filename).catch(() => {});

      return result;
    } catch (err) {
      await fs.unlink(filename).catch(() => {});
      throw err;
    }
  }

  /**
   * Compile and execute Java code
   */
  async executeJava(code) {
    // Extract class name from code
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : 'Main';

    const filename = path.join(this.tempDir, `${className}.java`);
    const classFile = path.join(this.tempDir, `${className}.class`);

    try {
      // Write code to file
      await fs.writeFile(filename, code);

      // Compile
      const compileResult = await this.runCommand(
        `javac ${filename}`,
        this.timeout
      );

      if (compileResult.exitCode !== 0) {
        throw new Error(`Compilation failed: ${compileResult.stderr}`);
      }

      // Execute
      const execResult = await this.runCommand(
        `java -cp ${this.tempDir} ${className}`,
        this.timeout
      );

      // Cleanup
      await fs.unlink(filename).catch(() => {});
      await fs.unlink(classFile).catch(() => {});

      return {
        ...execResult,
        compilation: compileResult
      };
    } catch (err) {
      await fs.unlink(filename).catch(() => {});
      await fs.unlink(classFile).catch(() => {});
      throw err;
    }
  }

  /**
   * Compile and execute C code
   */
  async executeC(code) {
    const sourceFile = path.join(this.tempDir, `temp_${Date.now()}.c`);
    const binaryFile = path.join(this.tempDir, `temp_${Date.now()}`);

    try {
      // Write code to file
      await fs.writeFile(sourceFile, code);

      // Compile with gcc
      const compileResult = await this.runCommand(
        `gcc ${sourceFile} -o ${binaryFile} -lm`,
        this.timeout
      );

      if (compileResult.exitCode !== 0) {
        throw new Error(`Compilation failed: ${compileResult.stderr}`);
      }

      // Execute
      const execResult = await this.runCommand(binaryFile, this.timeout);

      // Cleanup
      await fs.unlink(sourceFile).catch(() => {});
      await fs.unlink(binaryFile).catch(() => {});

      return {
        ...execResult,
        compilation: compileResult
      };
    } catch (err) {
      await fs.unlink(sourceFile).catch(() => {});
      await fs.unlink(binaryFile).catch(() => {});
      throw err;
    }
  }

  /**
   * Execute code based on language
   */
  async execute(code, language) {
    await this.init();

    switch (language.toLowerCase()) {
      case 'python':
        return await this.executePython(code);

      case 'java':
        return await this.executeJava(code);

      case 'c':
        return await this.executeC(code);

      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Run shell command with timeout
   */
  runCommand(command, timeout) {
    return new Promise((resolve, reject) => {
      const process = exec(command, {
        timeout,
        maxBuffer: 1024 * 1024 // 1MB
      }, (error, stdout, stderr) => {
        if (error && error.code !== 'ENOENT') {
          // Command executed but returned non-zero exit code
          resolve({
            exitCode: error.code || 1,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            success: false
          });
        } else if (error) {
          // Command not found or other error
          reject(error);
        } else {
          // Success
          resolve({
            exitCode: 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            success: true
          });
        }
      });

      // Handle timeout
      setTimeout(() => {
        process.kill();
        reject(new Error('Execution timeout'));
      }, timeout + 1000);
    });
  }

  /**
   * Verify transpilation by comparing outputs
   */
  async verifyTranspilation(originalCode, translatedCode, fromLang, toLang) {
    try {
      // Execute original code
      const originalResult = await this.execute(originalCode, fromLang);

      // Execute translated code
      const translatedResult = await this.execute(translatedCode, toLang);

      // Compare outputs
      const outputsMatch = originalResult.stdout === translatedResult.stdout;

      return {
        success: outputsMatch,
        original: {
          stdout: originalResult.stdout,
          stderr: originalResult.stderr,
          exitCode: originalResult.exitCode
        },
        translated: {
          stdout: translatedResult.stdout,
          stderr: translatedResult.stderr,
          exitCode: translatedResult.exitCode
        },
        outputsMatch
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Cleanup temp directory
   */
  async cleanup() {
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        await fs.unlink(path.join(this.tempDir, file)).catch(() => {});
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

module.exports = { Executor };
