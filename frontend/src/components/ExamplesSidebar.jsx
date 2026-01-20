import './ExamplesSidebar.css';

/**
 * Sidebar component displaying code examples and settings
 * Shows language-specific examples based on the selected source language
 */
export function ExamplesSidebar({
  examples,
  selectedExample,
  onSelectExample,
  autoTranslate,
  onAutoTranslateChange,
  sourceLanguage
}) {
  const languageLabels = {
    python: 'Python',
    java: 'Java',
    c: 'C'
  };

  return (
    <div className="sidebar">
      <h3>Examples</h3>
      <div className="language-badge">
        {languageLabels[sourceLanguage] || 'Python'}
      </div>
      <div className="examples-list">
        {examples.map((example, index) => (
          <button
            key={index}
            className={`example-btn ${selectedExample === index ? 'active' : ''}`}
            onClick={() => onSelectExample(index)}
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
            onChange={(e) => onAutoTranslateChange(e.target.checked)}
          />
          <span>Auto-translate</span>
        </label>
      </div>
    </div>
  );
}
