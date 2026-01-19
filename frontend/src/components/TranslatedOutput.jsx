import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { downloadCode, copyToClipboard, getFileExtension } from '../utils/fileUtils';
import './TranslatedOutput.css';

/**
 * Component displaying translated code with tabs for different languages
 */
export function TranslatedOutput({ javaCode, cCode }) {
  const [activeTab, setActiveTab] = useState('java');
  const [copySuccess, setCopySuccess] = useState(false);

  const currentCode = activeTab === 'java' ? javaCode : cCode;
  const hasCode = javaCode || cCode;

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
