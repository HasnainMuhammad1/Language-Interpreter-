import { useState } from 'react';
import axios from 'axios';
import './ExecutionPanel.css';

/**
 * Execution Panel Component
 * Compiles and runs code, shows output
 */
export function ExecutionPanel({ code, language }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [execution, setExecution] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const handleExecute = async () => {
    if (!code.trim()) {
      return;
    }

    setIsExecuting(true);
    setShowPanel(true);
    setExecution(null);

    try {
      const response = await axios.post('/api/execute', {
        code,
        language
      });

      setExecution(response.data);
    } catch (err) {
      console.error('Execution error:', err);
      setExecution({
        success: false,
        output: '',
        errors: err.response?.data?.error || 'Execution service unavailable'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="execution-panel">
      <button
        className="btn btn-execute"
        onClick={handleExecute}
        disabled={isExecuting || !code.trim()}
      >
        {isExecuting ? '⚙️ Running...' : '▶️ Run Code'}
      </button>

      {showPanel && (
        <div className="execution-result">
          <div className="execution-header">
            <span className="execution-title">
              {isExecuting ? '⚙️ Executing...' : execution?.success ? '✅ Execution Complete' : '❌ Execution Failed'}
            </span>
            <button
              className="close-btn"
              onClick={() => setShowPanel(false)}
            >
              ×
            </button>
          </div>

          {execution && (
            <div className="execution-body">
              {execution.output && (
                <div className="execution-section">
                  <h4>📤 Output:</h4>
                  <pre className="execution-output">{execution.output}</pre>
                </div>
              )}

              {execution.errors && (
                <div className="execution-section">
                  <h4>❌ Errors:</h4>
                  <pre className="execution-errors">{execution.errors}</pre>
                </div>
              )}

              {!execution.output && !execution.errors && execution.success && (
                <div className="execution-section">
                  <p className="no-output">✨ Code executed successfully with no output</p>
                </div>
              )}

              <div className="execution-meta">
                <span>Exit Code: <strong>{execution.exitCode ?? 'N/A'}</strong></span>
                <span>Language: <strong>{language.toUpperCase()}</strong></span>
              </div>
            </div>
          )}

          {isExecuting && (
            <div className="execution-loading">
              <div className="spinner"></div>
              <p>Compiling and running {language} code...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
