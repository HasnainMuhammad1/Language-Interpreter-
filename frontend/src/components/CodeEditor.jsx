import Editor from '@monaco-editor/react';
import './CodeEditor.css';

/**
 * Code editor component with Monaco Editor
 */
export function CodeEditor({
  title,
  language,
  value,
  onChange,
  readOnly = false,
  height = '500px'
}) {
  const editorOptions = {
    readOnly,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <h2>{title}</h2>
      </div>
      <div className="editor-wrapper">
        <Editor
          height={height}
          defaultLanguage={language}
          language={language}
          theme="vs-dark"
          value={value}
          onChange={onChange}
          options={editorOptions}
        />
      </div>
    </div>
  );
}
