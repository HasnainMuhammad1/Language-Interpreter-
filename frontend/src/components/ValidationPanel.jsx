import { useState } from 'react';
import axios from 'axios';
import './ValidationPanel.css';

/**
 * Validation Panel Component
 * Shows validation errors and warnings before translation
 */
export function ValidationPanel({ sourceCode, sourceLanguage }) {
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const handleValidate = async () => {
    if (!sourceCode.trim()) {
      return;
    }

    setIsValidating(true);
    setShowPanel(true);

    try {
      const response = await axios.post('/api/validate', {
        code: sourceCode,
        language: sourceLanguage
      });

      setValidation(response.data);
    } catch (err) {
      console.error('Validation error:', err);
      setValidation({
        success: false,
        message: 'Validation service unavailable'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = () => {
    if (!validation) return '❓';
    if (validation.success) return '✅';
    return '❌';
  };

  const getStatusColor = () => {
    if (!validation) return '#999';
    if (validation.success) return '#4caf50';
    return '#f44336';
  };

  return (
    <div className="validation-panel">
      <button
        className="btn btn-validate"
        onClick={handleValidate}
        disabled={isValidating || !sourceCode.trim()}
      >
        {isValidating ? 'Validating...' : '🔍 Validate Code'}
      </button>

      {showPanel && validation && (
        <div className="validation-result" style={{ borderColor: getStatusColor() }}>
          <div className="validation-header">
            <span className="validation-icon">{getStatusIcon()}</span>
            <span className="validation-title">
              {validation.success ? 'Code Valid' : 'Validation Issues Found'}
            </span>
            <button
              className="close-btn"
              onClick={() => setShowPanel(false)}
            >
              ×
            </button>
          </div>

          <div className="validation-body">
            {validation.errors && validation.errors.length > 0 && (
              <div className="validation-section errors">
                <h4>❌ Errors ({validation.errors.length})</h4>
                <ul>
                  {validation.errors.map((error, idx) => (
                    <li key={idx}>
                      <strong>{error.message}</strong>
                      {error.node && <span className="node-type"> ({error.node})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings && validation.warnings.length > 0 && (
              <div className="validation-section warnings">
                <h4>⚠️ Warnings ({validation.warnings.length})</h4>
                <ul>
                  {validation.warnings.map((warning, idx) => (
                    <li key={idx}>
                      <strong>{warning.message}</strong>
                      {warning.node && <span className="node-type"> ({warning.node})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.success && (!validation.warnings || validation.warnings.length === 0) && (
              <div className="validation-success">
                <p>✨ No issues found! Your code is ready to translate.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
