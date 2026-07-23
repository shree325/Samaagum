import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Placeholder } from '@tiptap/extension-placeholder';
import { FontSize } from './extensions/FontSize';
import Toolbar from './Toolbar';
import './styles.css';

interface RichTextEditorProps {
  value: string;
  onChange?: (html: string) => void;
  onTextLengthChange?: (length: number) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const isHtml = (str: string) => {
  if (!str) return false;
  const doc = new DOMParser().parseFromString(str, 'text/html');
  return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
};

export const RichTextEditor: React.FC<RichTextEditorProps> = React.memo(({
  value,
  onChange,
  onTextLengthChange,
  placeholder = 'Write your event/group description...',
  readOnly = false,
  className = '',
  style
}) => {
  const [isReady, setIsReady] = useState(false);

  // Convert plain text to initial HTML to preserve newlines and paragraphs
  const getInitialContent = (val: string) => {
    if (!val) return '';
    if (isHtml(val)) return val;
    
    // Clean up any literal stray tags at the end if it's being parsed as plain text
    let cleanVal = val.replace(/<\/p><p><\/p>$/i, '');
    return `<p>${cleanVal.replace(/\n/g, '<br>')}</p>`;
  };

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        // Disable extensions that we might override or configure explicitly if needed,
        // though StarterKit handles bold, italic, lists, and headings properly out of the box.
      }),
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: getInitialContent(value),
    onUpdate: ({ editor }) => {
      // Tiptap returns <p></p> or <p><br></p> when empty
      let html = editor.getHTML();
      const text = editor.getText().trim();
      
      if (text.length === 0 && (!html.includes('<img') && !html.includes('<iframe'))) {
        html = '';
      }

      if (onChange) {
        onChange(html);
      }
      if (onTextLengthChange) {
        onTextLengthChange(text.length);
      }
    },
    onCreate: ({ editor }) => {
      if (onTextLengthChange) {
        onTextLengthChange(editor.getText().trim().length);
      }
      setIsReady(true);
    }
  });

  // Sync external value changes if it's completely different (e.g. initial load delay or reset)
  useEffect(() => {
    if (editor && value !== undefined && isReady) {
      const currentHtml = editor.getHTML();
      // Only set content if the new value is actually different to avoid cursor jumps
      if (value !== currentHtml && value !== '') {
        const parsedNewValue = getInitialContent(value);
        if (parsedNewValue !== currentHtml) {
          // If the editor is functionally empty and we get a new value, update it
          editor.commands.setContent(parsedNewValue);
          if (onTextLengthChange) {
            onTextLengthChange(editor.getText().trim().length);
          }
        }
      } else if (value === '' && editor.getText().trim().length > 0) {
        editor.commands.setContent('');
        if (onTextLengthChange) {
          onTextLengthChange(0);
        }
      }
    }
  }, [value, editor, isReady]);

  // Update editable state if readOnly prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  return (
    <div className={`rich-text-wrapper ${className}`} style={style}>
      {!readOnly && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="rich-text-editor" />
    </div>
  );
});

export default RichTextEditor;
