import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTranslator } from './hooks/useTranslator';
import { ExamplesSidebar } from './components/ExamplesSidebar';
import { TranslatedOutput } from './components/TranslatedOutput';
import { EXAMPLES } from './constants/examples';
import './App.css';

/**
 * Main application component for the Python Language Interpreter
 * Provides a UI for translating Python code to Java and C
 */
function App() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [autoTranslate, setAutoTranslate] = useState(false);

  const {
    pythonCode,
    setPythonCode,
    javaCode,
    cCode,
    isTranslating,
    error,
    translate,
    reset
  } = useTranslator(EXAMPLES[0].code, autoTranslate);

  const handleExampleSelect = (index) => {
    setSelectedExample(index);
    setPythonCode(EXAMPLES[index].code);
    reset();
  };

  const handleCodeChange = (value) => {
    setPythonCode(value || '');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Python Language Interpreter</h1>
        <p>Translate Python to Java and C instantly</p>
      </header>

      <div className="container">
        <ExamplesSidebar
          selectedExample={selectedExample}
          onSelectExample={handleExampleSelect}
          autoTranslate={autoTranslate}
          onAutoTranslateChange={setAutoTranslate}
        />

        <div className="main-content">
          <div className="editor-section">
            <div className="section-header">
              <h2>Python Code</h2>
            </div>
            <div className="editor-container">
              <Editor
                height="500px"
                defaultLanguage="python"
                theme="vs-dark"
                value={pythonCode}
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
            <TranslatedOutput javaCode={javaCode} cCode={cCode} />
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Built with React, Node.js, and Monaco Editor</p>
      </footer>
    </div>
  );
}

export default App;
