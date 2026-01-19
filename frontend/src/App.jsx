import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import './App.css'

const EXAMPLES = [
  {
    name: 'Hello World',
    code: `# Hello World Example
print("Hello, World!")`
  },
  {
    name: 'Variables and Math',
    code: `# Variables and basic math
x = 10
y = 20
sum = x + y
print(sum)`
  },
  {
    name: 'For Loop',
    code: `# For loop example
for i in range(5):
    print(i)`
  },
  {
    name: 'Function',
    code: `# Function example
def greet(name):
    return "Hello, " + name

result = greet("Alice")
print(result)`
  },
  {
    name: 'Fibonacci',
    code: `# Fibonacci sequence
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(fibonacci(i))`
  },
  {
    name: 'Class Example',
    code: `# Class example
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return "Hello, I'm " + self.name`
  }
];

function App() {
  const [pythonCode, setPythonCode] = useState(EXAMPLES[0].code);
  const [javaCode, setJavaCode] = useState('');
  const [cCode, setCCode] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('java');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [selectedExample, setSelectedExample] = useState(0);

  useEffect(() => {
    if (autoTranslate && pythonCode) {
      const timer = setTimeout(() => {
        handleTranslate();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pythonCode, autoTranslate]);

  const handleTranslate = async () => {
    if (!pythonCode.trim()) {
      setError('Please enter some Python code');
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      const response = await axios.post('/api/translate/all', {
        code: pythonCode
      });

      if (response.data.success) {
        setJavaCode(response.data.translations.java);
        setCCode(response.data.translations.c);
      } else {
        setError(response.data.error || 'Translation failed');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.response?.data?.error || 'Failed to translate code. Make sure the backend server is running.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleEditorChange = (value) => {
    setPythonCode(value || '');
  };

  const handleDownload = (language) => {
    let code = '';
    let extension = '';

    if (language === 'java') {
      code = javaCode;
      extension = 'java';
    } else if (language === 'c') {
      code = cCode;
      extension = 'c';
    }

    if (!code) {
      alert('Please translate the code first');
      return;
    }

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadExample = (index) => {
    setSelectedExample(index);
    setPythonCode(EXAMPLES[index].code);
    setJavaCode('');
    setCCode('');
    setError('');
  };

  const handleCopyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Python Language Interpreter</h1>
        <p>Translate Python to Java and C instantly</p>
      </header>

      <div className="container">
        <div className="sidebar">
          <h3>Examples</h3>
          <div className="examples-list">
            {EXAMPLES.map((example, index) => (
              <button
                key={index}
                className={`example-btn ${selectedExample === index ? 'active' : ''}`}
                onClick={() => handleLoadExample(index)}
              >
                {example.name}
              </button>
            ))}
          </div>

          <div className="settings">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
              />
              <span>Auto-translate</span>
            </label>
          </div>
        </div>

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
                onChange={handleEditorChange}
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
                onClick={handleTranslate}
                disabled={isTranslating}
              >
                {isTranslating ? 'Translating...' : 'Translate'}
              </button>
            </div>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>

          <div className="output-section">
            <div className="section-header">
              <h2>Translated Code</h2>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'java' ? 'active' : ''}`}
                  onClick={() => setActiveTab('java')}
                >
                  Java
                </button>
                <button
                  className={`tab ${activeTab === 'c' ? 'active' : ''}`}
                  onClick={() => setActiveTab('c')}
                >
                  C
                </button>
              </div>
            </div>

            <div className="editor-container">
              {activeTab === 'java' && (
                <Editor
                  height="500px"
                  defaultLanguage="java"
                  theme="vs-dark"
                  value={javaCode}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              )}
              {activeTab === 'c' && (
                <Editor
                  height="500px"
                  defaultLanguage="c"
                  theme="vs-dark"
                  value={cCode}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              )}
            </div>

            <div className="actions">
              <button
                className="btn btn-secondary"
                onClick={() => handleDownload(activeTab)}
                disabled={!javaCode && !cCode}
              >
                Download {activeTab.toUpperCase()}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleCopyToClipboard(activeTab === 'java' ? javaCode : cCode)}
                disabled={!javaCode && !cCode}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Built with React, Node.js, and Monaco Editor</p>
      </footer>
    </div>
  )
}

export default App
