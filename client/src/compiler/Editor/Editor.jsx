// components/Editor/Editor.jsx
import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, setCode, language, theme, fontSize, fontFamily }) => {
  const handleEditorChange = (value) => {
    setCode(value);
  };

  return (
    <div className="h-96 lg:h-[500px]">
      <Editor
        height="100%"
        language={language}
        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
        value={code}
        onChange={handleEditorChange}
        options={{
          fontSize: fontSize,
          fontFamily: fontFamily,
          minimap: { enabled: true },
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 10 },
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
        loading={<div className="flex items-center justify-center h-full">Loading Editor...</div>}
      />
    </div>
  );
};

export default CodeEditor;