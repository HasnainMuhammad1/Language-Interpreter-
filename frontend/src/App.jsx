import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTranslator } from './hooks/useTranslator';
import { ExamplesSidebar } from './components/ExamplesSidebar';
import { TranslatedOutput } from './components/TranslatedOutput';
import { getExamplesByLanguage, PYTHON_EXAMPLES } from './constants/examples';
import './App.css';

/**
 * Main application component for the Multi-Language Interpreter
 * Provides a UI for translating between Python, Java, and C
 */
function App() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [autoTranslate, setAutoTranslate] = useState(false);

  const {
    sourceCode,
    setSourceCode,
    sourceLanguage,
    setSourceLanguage,
    translations,
    isTranslating,
    error,
    translate,
    reset
  } = useTranslator(PYTHON_EXAMPLES[0].code, 'python', autoTranslate);

  // Get examples for current source language
  const currentExamples = getExamplesByLanguage(sourceLanguage);

  // Reset example selection when language changes
  useEffect(() => {
    setSelectedExample(0);
    setSourceCode(currentExamples[0].code);
  }, [sourceLanguage]);

  const handleExampleSelect = (index) => {
    setSelectedExample(index);
    setSourceCode(currentExamples[index].code);
    reset();
  };

  const handleCodeChange = (value) => {
    setSourceCode(value || '');
  };

  const handleLanguageChange = (newLanguage) => {
    setSourceLanguage(newLanguage);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Multi-Language Code Translator</h1>
        <p>Translate between Python, Java, and C instantly</p>
      </header>

      <div className="container">
        <ExamplesSidebar
          examples={currentExamples}
          selectedExample={selectedExample}
          onSelectExample={handleExampleSelect}
          autoTranslate={autoTranslate}
          onAutoTranslateChange={setAutoTranslate}
          sourceLanguage={sourceLanguage}
        />

        <div className="main-content">
          <div className="editor-section">
            <div className="section-header">
              <h2>Source Code</h2>
              <div className="language-selector">
                <label>Language:</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="language-dropdown"
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="c">C</option>
                </select>
              </div>
            </div>
            <div className="editor-container">
              <Editor
                height="500px"
                defaultLanguage={sourceLanguage}
                language={sourceLanguage}
                theme="vs-dark"
                value={sourceCode}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
            <div className="actions">
              <button
                className="btn btn-primary"
                onClick={translate}
                disabled={isTranslating}
              >
                {isTranslating ? 'Translating...' : 'Translate'}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="output-section">
            <TranslatedOutput
              sourceLanguage={sourceLanguage}
              translations={translations}
            />
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Built with React, Node.js, and Monaco Editor • Supports Python, Java, and C</p>
      </footer>
    </div>
  );
}

export default App;
