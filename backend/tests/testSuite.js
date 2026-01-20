/**
 * Test Suite for Transpiler
 * Verifies translation correctness across all language combinations
 */

const { parsePython } = require('../parsers/pythonParser');
const { parseJava } = require('../parsers/javaParser');
const { parseC } = require('../parsers/cParser');
const { translateToJava } = require('../translators/javaTranslator');
const { translateToC } = require('../translators/cTranslator');
const { translateToPython } = require('../translators/pythonTranslator');
const { Executor } = require('../core/executor');
const { Validator } = require('../core/validator');

class TestSuite {
  constructor() {
    this.executor = new Executor();
    this.validator = new Validator();
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }

  /**
   * Add a test case
   */
  addTest(name, sourceCode, sourceLang, targetLang, expectedOutput) {
    this.tests.push({
      name,
      sourceCode,
      sourceLang,
      targetLang,
      expectedOutput
    });
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log(`\n🧪 Running ${this.tests.length} tests...\n`);

    for (const test of this.tests) {
      await this.runTest(test);
    }

    this.printSummary();
    return this.results;
  }

  /**
   * Run a single test
   */
  async runTest(test) {
    const testName = `${test.name} (${test.sourceLang} → ${test.targetLang})`;

    try {
      // Parse source code
      const ast = this.parse(test.sourceCode, test.sourceLang);

      // Validate source
      const validation = this.validator.validate(ast, test.sourceLang);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Translate
      const translatedCode = this.translate(ast, test.targetLang);

      // Execute original
      const originalResult = await this.executor.execute(test.sourceCode, test.sourceLang);

      // Execute translated
      const translatedResult = await this.executor.execute(translatedCode, test.targetLang);

      // Compare outputs
      const outputsMatch = originalResult.stdout.trim() === translatedResult.stdout.trim();
      const expectedMatch = test.expectedOutput
        ? originalResult.stdout.trim() === test.expectedOutput.trim()
        : true;

      if (outputsMatch && expectedMatch) {
        this.results.passed++;
        console.log(`✅ PASS: ${testName}`);
        this.results.details.push({
          test: testName,
          status: 'PASS',
          output: originalResult.stdout.trim()
        });
      } else {
        this.results.failed++;
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Expected: ${test.expectedOutput || originalResult.stdout.trim()}`);
        console.log(`   Got:      ${translatedResult.stdout.trim()}`);
        this.results.errors.push({
          test: testName,
          expected: test.expectedOutput || originalResult.stdout.trim(),
          actual: translatedResult.stdout.trim()
        });
        this.results.details.push({
          test: testName,
          status: 'FAIL',
          expected: test.expectedOutput || originalResult.stdout.trim(),
          actual: translatedResult.stdout.trim()
        });
      }
    } catch (error) {
      this.results.failed++;
      console.log(`❌ ERROR: ${testName}`);
      console.log(`   ${error.message}`);
      this.results.errors.push({
        test: testName,
        error: error.message
      });
      this.results.details.push({
        test: testName,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  /**
   * Parse code based on language
   */
  parse(code, language) {
    switch (language.toLowerCase()) {
      case 'python':
        return parsePython(code);
      case 'java':
        return parseJava(code);
      case 'c':
        return parseC(code);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Translate AST to target language
   */
  translate(ast, targetLanguage) {
    switch (targetLanguage.toLowerCase()) {
      case 'python':
        return translateToPython(ast);
      case 'java':
        return translateToJava(ast);
      case 'c':
        return translateToC(ast);
      default:
        throw new Error(`Unsupported target language: ${targetLanguage}`);
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.tests.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Load standard test cases
   */
  loadStandardTests() {
    // Basic output tests
    this.addTest(
      'Hello World',
      'print("Hello, World!")',
      'python',
      'java',
      'Hello, World!'
    );

    this.addTest(
      'Simple Math',
      'x = 10\ny = 20\nprint(x + y)',
      'python',
      'java',
      '30'
    );

    this.addTest(
      'For Loop',
      'for i in range(3):\n    print(i)',
      'python',
      'java',
      '0\n1\n2'
    );

    // Function tests
    this.addTest(
      'Simple Function',
      'def add(a, b):\n    return a + b\n\nprint(add(5, 3))',
      'python',
      'java',
      '8'
    );

    this.addTest(
      'Fibonacci',
      'def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\nprint(fib(5))',
      'python',
      'java',
      '5'
    );

    // Conditional tests
    this.addTest(
      'If-Else',
      'x = 10\nif x > 5:\n    print("greater")\nelse:\n    print("lesser")',
      'python',
      'java',
      'greater'
    );

    // Variable tests
    this.addTest(
      'Multiple Variables',
      'a = 1\nb = 2\nc = 3\nprint(a + b + c)',
      'python',
      'java',
      '6'
    );

    // String tests
    this.addTest(
      'String Output',
      'name = "Alice"\nprint(name)',
      'python',
      'java',
      'Alice'
    );

    // Java to Python tests
    this.addTest(
      'Java Hello World',
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}',
      'java',
      'python',
      'Hello'
    );

    // C to Python tests
    this.addTest(
      'C Hello World',
      '#include <stdio.h>\n\nint main() {\n    printf("Hello\\n");\n    return 0;\n}',
      'c',
      'python',
      'Hello'
    );
  }
}

module.exports = { TestSuite };

// Run tests if executed directly
if (require.main === module) {
  const suite = new TestSuite();
  suite.loadStandardTests();
  suite.runAll().then(() => {
    process.exit(suite.results.failed === 0 ? 0 : 1);
  });
}
