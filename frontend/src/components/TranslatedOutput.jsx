import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { downloadCode, copyToClipboard, getFileExtension } from '../utils/fileUtils';
import './TranslatedOutput.css';

/**
 * Component displaying translated code with tabs for different target languages
 * Dynamically shows available target languages based on source language
 */
export function TranslatedOutput({ sourceLanguage, translations }) {
  // Determine available target languages (all except source)
  const allLanguages = ['python', 'java', 'c'];
  const targetLanguages = allLanguages.filter(lang => lang !== sourceLanguage.toLowerCase());

  const [activeTab, setActiveTab] = useState(targetLanguages[0] || 'java');
  const [copySuccess, setCopySuccess] = useState(false);

  // Update active tab when source language changes
  useEffect(() => {
    if (!targetLanguages.includes(activeTab)) {
      setActiveTab(targetLanguages[0] || 'java');
    }
  }, [sourceLanguage]);

  const currentCode = translations[activeTab] || '';
  const hasCode = Object.values(translations).some(code => code);

  const languageLabels = {
    python: 'Python',
    java: 'Java',
    c: 'C'
  };

  const handleDownload = () => {
    const extension = getFileExtension(activeTab);
    downloadCode(currentCode, `translated.${extension}`);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(currentCode);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="translated-output">
      <div className="output-header">
        <h2>Translated Code</h2>
        <div className="tabs">
          {targetLanguages.map(lang => (
            <button
              key={lang}
              className={`tab ${activeTab === lang ? 'active' : ''}`}
              onClick={() => setActiveTab(lang)}
            >
              {languageLabels[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="output-editor">
        <Editor
          height="500px"
          defaultLanguage={activeTab}
          language={activeTab}
          theme="vs-dark"
          value={currentCode}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="output-actions">
        <button
          className="btn btn-secondary"
          onClick={handleDownload}
          disabled={!hasCode}
        >
          Download {activeTab.toUpperCase()}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleCopy}
          disabled={!hasCode}
        >
          {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </div>
  );
}
