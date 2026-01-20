const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Parsers
const { parsePython } = require('./parsers/pythonParser');
const { parseJava } = require('./parsers/javaParser');
const { parseC } = require('./parsers/cParser');

// Translators
const { translateToJava } = require('./translators/javaTranslator');
const { translateToC } = require('./translators/cTranslator');
const { translateToPython } = require('./translators/pythonTranslator');

// Core systems
const { Validator } = require('./core/validator');
const { Executor } = require('./core/executor');
const { TypeSystem } = require('./core/typeSystem');
const { StandardLibrary } = require('./core/standardLibrary');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize core systems
const validator = new Validator();
const executor = new Executor();
const typeSystem = new TypeSystem();
const standardLibrary = new StandardLibrary();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Production Transpiler API is running',
    features: {
      validation: true,
      execution: true,
      typeInference: true,
      standardLibrary: true
    }
  });
});

// Validate code endpoint
app.post('/api/validate', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    if (!language) {
      return res.status(400).json({ error: 'No language specified' });
    }

    // Parse code
    let ast;
    switch (language.toLowerCase()) {
      case 'python':
        ast = parsePython(code);
        break;
      case 'java':
        ast = parseJava(code);
        break;
      case 'c':
        ast = parseC(code);
        break;
      default:
        return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    // Validate
    const validation = validator.validate(ast, language);

    res.json({
      success: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      message: validator.formatResults()
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Validation failed'
    });
  }
});

// Execute code endpoint
app.post('/api/execute', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    if (!language) {
      return res.status(400).json({ error: 'No language specified' });
    }

    // Execute code
    const result = await executor.execute(code, language);

    res.json({
      success: result.success,
      output: result.stdout,
      errors: result.stderr,
      exitCode: result.exitCode
    });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Execution failed'
    });
  }
});

// Transpile and verify endpoint
app.post('/api/transpile-verify', async (req, res) => {
  try {
    const { code, sourceLanguage, targetLanguage } = req.body;

    if (!code || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Parse source code
    let ast;
    switch (sourceLanguage.toLowerCase()) {
      case 'python':
        ast = parsePython(code);
        break;
      case 'java':
        ast = parseJava(code);
        break;
      case 'c':
        ast = parseC(code);
        break;
      default:
        return res.status(400).json({ error: `Unsupported source language: ${sourceLanguage}` });
    }

    // Validate source code
    const validation = validator.validate(ast, sourceLanguage);
    if (!validation.valid) {
      return res.json({
        success: false,
        validation,
        message: 'Source code has validation errors'
      });
    }

    // Translate
    let translatedCode;
    switch (targetLanguage.toLowerCase()) {
      case 'python':
        translatedCode = translateToPython(ast);
        break;
      case 'java':
        translatedCode = translateToJava(ast);
        break;
      case 'c':
        translatedCode = translateToC(ast);
        break;
      default:
        return res.status(400).json({ error: `Unsupported target language: ${targetLanguage}` });
    }

    // Verify by execution
    const verification = await executor.verifyTranspilation(
      code,
      translatedCode,
      sourceLanguage,
      targetLanguage
    );

    res.json({
      success: true,
      translatedCode,
      validation,
      verification,
      outputsMatch: verification.outputsMatch
    });
  } catch (error) {
    console.error('Transpile-verify error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Transpilation verification failed'
    });
  }
});

// General translation endpoint - handles all language combinations
app.post('/api/translate', async (req, res) => {
  try {
    const { code, sourceLanguage, targetLanguages, validate: shouldValidate = true } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    if (!sourceLanguage) {
      return res.status(400).json({ error: 'No source language specified' });
    }

    if (!targetLanguages || targetLanguages.length === 0) {
      return res.status(400).json({ error: 'No target languages specified' });
    }

    // Parse source code based on language
    let ast;
    switch (sourceLanguage.toLowerCase()) {
      case 'python':
        ast = parsePython(code);
        break;
      case 'java':
        ast = parseJava(code);
        break;
      case 'c':
        ast = parseC(code);
        break;
      default:
        return res.status(400).json({ error: `Unsupported source language: ${sourceLanguage}` });
    }

    // Validate if requested
    let validation = null;
    if (shouldValidate) {
      validation = validator.validate(ast, sourceLanguage);
      if (!validation.valid) {
        return res.json({
          success: false,
          validation,
          translations: {},
          message: 'Source code has validation errors. Fix errors before translating.'
        });
      }
    }

    // Translate to target languages
    const translations = {};
    for (const targetLang of targetLanguages) {
      switch (targetLang.toLowerCase()) {
        case 'python':
          if (sourceLanguage.toLowerCase() !== 'python') {
            translations.python = translateToPython(ast);
          }
          break;
        case 'java':
          if (sourceLanguage.toLowerCase() !== 'java') {
            translations.java = translateToJava(ast);
          }
          break;
        case 'c':
          if (sourceLanguage.toLowerCase() !== 'c') {
            translations.c = translateToC(ast);
          }
          break;
        default:
          console.warn(`Unsupported target language: ${targetLang}`);
      }
    }

    res.json({
      success: true,
      sourceLanguage,
      translations,
      validation
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Translation failed'
    });
  }
});

// Legacy endpoints for backward compatibility

// Translate Python to Java
app.post('/api/translate/java', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const ast = parsePython(code);
    const javaCode = translateToJava(ast);

    res.json({
      success: true,
      translatedCode: javaCode,
      language: 'java'
    });
  } catch (error) {
    console.error('Java translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Translation failed'
    });
  }
});

// Translate Python to C
app.post('/api/translate/c', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const ast = parsePython(code);
    const cCode = translateToC(ast);

    res.json({
      success: true,
      translatedCode: cCode,
      language: 'c'
    });
  } catch (error) {
    console.error('C translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Translation failed'
    });
  }
});

// Translate Python to both Java and C
app.post('/api/translate/all', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const ast = parsePython(code);
    const javaCode = translateToJava(ast);
    const cCode = translateToC(ast);

    res.json({
      success: true,
      translations: {
        java: javaCode,
        c: cCode
      }
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Translation failed'
    });
  }
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\nCleaning up...');
  await executor.cleanup();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Production Transpiler API running on port ${PORT}`);
  console.log(`📝 Supported languages: Python, Java, C`);
  console.log(`🔄 Translation directions: All combinations supported`);
  console.log(`✅ Features: Validation, Type Inference, Execution, Verification`);
});
