import React, { useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import './styles.css';

interface ToolbarProps {
  editor: Editor | null;
}

const SUPPORTED_FONTS = [
  'Agency FB', 'Algerian', 'Aptos', 'Aptos Display', 'Aptos Narrow',
  'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
  'Bahnschrift', 'Bahnschrift Condensed', 'Bahnschrift Light', 'Bahnschrift SemiBold',
  'Book Antiqua', 'Bookman Old Style', 'Calibri', 'Calibri Light',
  'Cambria', 'Candara', 'Century Gothic', 'Comic Sans MS', 'Consolas',
  'Constantia', 'Corbel', 'Courier New', 'Franklin Gothic Medium',
  'Garamond', 'Georgia', 'Impact', 'Lucida Bright', 'Lucida Console',
  'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
  'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold',
  'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'
];

const FONT_SIZES = [
  '8', '9', '10', '11', '12', '14', '16', '18', 
  '20', '22', '24', '26', '28', '36', '48', '72'
];

// Simple SVG Icons
const BoldIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>;
const ItalicIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>;
const UnderlineIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>;
const BulletListIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line><circle cx="4" cy="6" r="1"></circle><circle cx="4" cy="12" r="1"></circle><circle cx="4" cy="18" r="1"></circle></svg>;
const NumberedListIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>;
const ClearFormatIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10"></path><path d="M12 4v16"></path><line x1="3" y1="20" x2="21" y2="20"></line><line x1="18" y1="4" x2="6" y2="20"></line></svg>;

export const Toolbar = ({ editor }: ToolbarProps) => {
  if (!editor) return null;

  // Keep track of current font configurations
  const currentFontFamily = (editor.getAttributes('textStyle').fontFamily || '').replace(/['"]/g, '');
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '';

  // Get active heading level (if any)
  const currentStyle = useMemo(() => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
    return 'p';
  }, [
    editor.isActive('heading', { level: 1 }),
    editor.isActive('heading', { level: 2 }),
    editor.isActive('heading', { level: 3 }),
    editor.isActive('heading', { level: 4 }),
    editor.isActive('heading', { level: 5 }),
    editor.isActive('heading', { level: 6 }),
    editor.isActive('paragraph')
  ]);

  const onStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    
    const applyMarks = () => {
      // Re-apply existing text marks (font family, font size) to ensure persistence across style switch
      if (currentFontFamily) editor.chain().focus().setFontFamily(currentFontFamily).run();
      if (currentFontSize) editor.chain().focus().setFontSize(currentFontSize).run();
    };

    if (val === 'p') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(val.replace('h', ''), 10) as any;
      editor.chain().focus().toggleHeading({ level }).run();
    }
    
    // Slight delay to ensure marks are preserved over block conversion
    setTimeout(applyMarks, 0);

  }, [editor, currentFontFamily, currentFontSize]);

  const onFontFamilyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      editor.chain().focus().setFontFamily(val).run();
    } else {
      editor.chain().focus().unsetFontFamily().run();
    }
  }, [editor]);

  const onFontSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      editor.chain().focus().setFontSize(`${val}pt`).run();
    } else {
      editor.chain().focus().unsetFontSize().run();
    }
  }, [editor]);

  return (
    <div className="rich-text-toolbar" role="toolbar" aria-label="Rich Text Editor Toolbar">
      <select className="rt-select" value={currentStyle} onChange={onStyleChange} aria-label="Style">
        <option value="h1">Title</option>
        <option value="h2">Subtitle</option>
        <option value="h3">Heading</option>
        <option value="h4">Subheading</option>
        <option value="h5">Section</option>
        <option value="h6">Subsection</option>
        <option value="p">Body</option>
      </select>
      
      <div className="rt-divider" />

      <select className="rt-select" value={currentFontFamily} onChange={onFontFamilyChange} aria-label="Font Family">
        <option value="">Default Font</option>
        {SUPPORTED_FONTS.map(font => (
          <option key={font} value={font} style={{ fontFamily: `"${font}", sans-serif` }}>{font}</option>
        ))}
      </select>

      <div className="rt-divider" />

      <select className="rt-select" value={currentFontSize.replace('pt', '')} onChange={onFontSizeChange} aria-label="Font Size">
        <option value="">Size</option>
        {FONT_SIZES.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>

      <div className="rt-divider" />

      <button
        type="button"
        className={`rt-btn ${editor.isActive('bold') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <BoldIcon />
      </button>

      <button
        type="button"
        className={`rt-btn ${editor.isActive('italic') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <ItalicIcon />
      </button>

      <button
        type="button"
        className={`rt-btn ${editor.isActive('underline') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
      >
        <UnderlineIcon />
      </button>

      <div className="rt-divider" />

      <button
        type="button"
        className={`rt-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
      >
        <BulletListIcon />
      </button>

      <button
        type="button"
        className={`rt-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Numbered List"
      >
        <NumberedListIcon />
      </button>

      <div className="rt-divider" />

      <button
        type="button"
        className="rt-btn"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        aria-label="Clear Formatting"
        title="Clear Formatting"
      >
        <ClearFormatIcon />
      </button>
    </div>
  );
};

export default Toolbar;
