import { EXAMPLES } from '../constants/examples';
import './ExamplesSidebar.css';

/**
 * Sidebar component displaying code examples and settings
 */
export function ExamplesSidebar({
  selectedExample,
  onSelectExample,
  autoTranslate,
  onAutoTranslateChange
}) {
  return (
    <div className="sidebar">
      <h3>Examples</h3>
      <div className="examples-list">
        {EXAMPLES.map((example, index) => (
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
