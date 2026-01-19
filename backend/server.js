const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { translateToJava } = require('./translators/javaTranslator');
const { translateToC } = require('./translators/cTranslator');
const { parsePython } = require('./parsers/pythonParser');

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

// Translate Python to Java
app.post('/api/translate/java', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Parse Python code
    const ast = parsePython(code);

    // Translate to Java
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

    // Parse Python code
    const ast = parsePython(code);

    // Translate to C
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

// Translate to both languages
app.post('/api/translate/all', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Parse Python code once
    const ast = parsePython(code);

    // Translate to both languages
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
});
