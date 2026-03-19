'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { createLowlight, common } from 'lowlight';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Link as LinkIcon,
  Image as ImageIcon, List, ListOrdered, Quote, Minus, AlignLeft, AlignCenter,
  AlignRight, Heading1, Heading2, Heading3, Highlighter,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import SlashMenu from './SlashMenu';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  mode?: 'wysiwyg' | 'markdown';
}

interface SlashState {
  active: boolean;
  position: { top: number; left: number } | null;
  query: string;
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarButton({
  onClick,
  active,
  tooltip,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  tooltip: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onClick();
          }}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded text-sm transition-colors',
            active
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

// ── Toolbar divider ───────────────────────────────────────────────────────────
function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing… type / for commands',
  editable = true,
  mode = 'wysiwyg',
}: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [slash, setSlash] = useState<SlashState>({
    active: false,
    position: null,
    query: '',
  });

  // ── Editor setup ───────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by lowlight version
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Underline,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    editable,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
      detectSlashCommand(editor);
    },
  });

  // Keep editor content in sync when content prop changes externally
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // ── Slash command detection ────────────────────────────────────────────────
  const closeSlash = useCallback(() => {
    setSlash({ active: false, position: null, query: '' });
  }, []);

  function detectSlashCommand(ed: ReturnType<typeof useEditor>) {
    if (!ed) return;
    const { from } = ed.state.selection;
    const text = ed.state.doc.textBetween(
      Math.max(0, from - 30),
      from,
      '\n',
    );
    const slashMatch = text.match(/(?:^|\n)\/([^\n]*)$/);
    if (slashMatch) {
      const query = slashMatch[1];
      // Get cursor position in the DOM
      const domPos = ed.view.coordsAtPos(from);
      setSlash({
        active: true,
        position: { top: domPos.bottom + 4, left: domPos.left },
        query,
      });
    } else {
      closeSlash();
    }
  }

  // Close slash menu on click outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (slash.active) {
        const target = e.target as Node;
        const wrapper = editorWrapperRef.current;
        if (wrapper && !wrapper.contains(target)) {
          closeSlash();
        }
      }
    }
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [slash.active, closeSlash]);

  // ── Image upload ───────────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = (await res.json()) as { url: string };
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        // Fallback: read as base64 for preview
        const reader = new FileReader();
        reader.onload = (ev) => {
          const src = ev.target?.result as string;
          if (src) editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
      }
    },
    [editor],
  );

  // Drag-and-drop on the editor wrapper
  function onDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      void handleImageUpload(file);
    }
  }

  // ── Link insertion ─────────────────────────────────────────────────────────
  function handleLinkInsert() {
    if (!editor) return;
    const current = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL:', current ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  // ── Toolbar render ─────────────────────────────────────────────────────────
  function renderToolbar() {
    if (!editor) return null;
    return (
      <div className="flex items-center gap-0.5 flex-wrap px-3 py-1.5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <ToolbarButton
          tooltip="Bold (⌘B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Italic (⌘I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Underline (⌘U)"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Highlight"
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          tooltip="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          tooltip="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          tooltip="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          tooltip="Align left"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Align center"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Align right"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton tooltip="Insert link" active={editor.isActive('link')} onClick={handleLinkInsert}>
          <LinkIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Upload image"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={14} />
        </ToolbarButton>

        <div className="flex-1" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={400}>
      <div
        ref={editorWrapperRef}
        className="tiptap-editor flex flex-col h-full overflow-hidden"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {editable && renderToolbar()}

        {mode === 'markdown' ? (
          <textarea
            className="flex-1 w-full resize-none p-6 text-sm font-mono text-gray-700 placeholder-gray-300 outline-none bg-white leading-relaxed"
            value={content}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            spellCheck={false}
            placeholder={placeholder}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} className="h-full" />
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImageUpload(file);
            e.target.value = '';
          }}
        />

        {/* Slash command menu */}
        {slash.active && editor && (
          <SlashMenu
            editor={editor}
            position={slash.position}
            query={slash.query}
            onClose={closeSlash}
            fileInputRef={fileInputRef}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
