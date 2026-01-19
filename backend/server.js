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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Language Interpreter API is running' });
});

// General translation endpoint - handles all language combinations
app.post('/api/translate', async (req, res) => {
  try {
    const { code, sourceLanguage, targetLanguages } = req.body;

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
      translations
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

app.listen(PORT, () => {
  console.log(`🚀 Language Interpreter API running on port ${PORT}`);
  console.log(`📝 Supported languages: Python, Java, C`);
  console.log(`🔄 Translation directions: All combinations supported`);
});
