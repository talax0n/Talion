'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlashMenuItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  action: (editor: Editor, fileInputRef?: React.RefObject<HTMLInputElement | null>) => void;
}

const SLASH_ITEMS: SlashMenuItem[] = [
  {
    label: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 size={14} />,
    action: (editor) =>
      editor.chain().focus().deleteRange(editor.state.selection).toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 size={14} />,
    action: (editor) =>
      editor.chain().focus().deleteRange(editor.state.selection).toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 size={14} />,
    action: (editor) =>
      editor.chain().focus().deleteRange(editor.state.selection).toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Bullet List',
    description: 'Unordered list with bullets',
    icon: <List size={14} />,
    action: (editor) =>
      editor.chain().focus().deleteRange(editor.state.selection).toggleBulletList().run(),
  },
  {
    label: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: <ListOrdered size={14} />,
    action: (editor) =>
      editor.chain().focus().deleteRange(editor.state.selection).toggleOrderedList().run(),
  },
  {
    label: 'Code Block',
    description: 'Syntax highlighted code',
    icon: <Code size={14} />,
    action: (editor) =>
      editor.chain().focus().deleteRange(editor.state.selection).toggleCodeBlock().run(),
  },
  {
    label: 'Quote',
    description: 'Blockquote for citations',
    icon: <Quote size={14} />,
    action: (editor) =>
      editor.chain().focus().deleteRange(editor.state.selection).toggleBlockquote().run(),
  },
  {
    label: 'Divider',
    description: 'Horizontal separator line',
    icon: <Minus size={14} />,
    action: (editor) =>
      editor.chain().focus().deleteRange(editor.state.selection).setHorizontalRule().run(),
  },
  {
    label: 'Image',
    description: 'Upload an image',
    icon: <Image size={14} />,
    action: (_editor, fileInputRef) => {
      fileInputRef?.current?.click();
    },
  },
];

interface SlashMenuProps {
  editor: Editor;
  position: { top: number; left: number } | null;
  query: string;
  onClose: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function SlashMenu({
  editor,
  position,
  query,
  onClose,
  fileInputRef,
}: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  const selectItem = useCallback(
    (item: SlashMenuItem) => {
      // Delete the "/" character and any query text before running action
      const { from } = editor.state.selection;
      const slashPos = from - query.length - 1; // -1 for the "/" itself
      editor
        .chain()
        .focus()
        .deleteRange({ from: slashPos, to: from })
        .run();
      item.action(editor, fileInputRef);
      onClose();
    },
    [editor, query, onClose, fileInputRef],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!position) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          selectItem(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [position, filtered, selectedIndex, selectItem, onClose]);

  if (!position || filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="slash-command-menu fixed z-50"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.map((item, idx) => (
        <button
          key={item.label}
          className={cn('slash-command-item w-full text-left', idx === selectedIndex && 'is-selected')}
          onMouseDown={(e) => {
            e.preventDefault();
            selectItem(item);
          }}
          onMouseEnter={() => setSelectedIndex(idx)}
        >
          <span className="slash-command-item-icon">{item.icon}</span>
          <span className="flex flex-col">
            <span className="font-medium leading-tight">{item.label}</span>
            <span className="text-xs opacity-60 leading-tight">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
