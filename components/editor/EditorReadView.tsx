import { cn } from '@/lib/utils';

interface EditorReadViewProps {
  content_html: string;
  className?: string;
}

export default function EditorReadView({ content_html, className }: EditorReadViewProps) {
  return (
    <article
      className={cn(
        // Base typography
        'text-gray-900 leading-7',
        // Headings
        '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mt-8 [&_h1]:mb-4',
        '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:mt-6 [&_h2]:mb-3',
        '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:mt-5 [&_h3]:mb-2',
        // Paragraphs
        '[&_p]:my-4',
        // Links
        '[&_a]:text-indigo-600 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-indigo-800',
        // Lists
        '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6',
        '[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6',
        '[&_li]:my-1',
        // Blockquote
        '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-4',
        // Code inline
        '[&_code]:bg-gray-100 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_code]:text-gray-800',
        // Code block
        '[&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:font-mono',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit',
        // Horizontal rule
        '[&_hr]:my-6 [&_hr]:border-gray-200',
        // Images
        '[&_img]:rounded-md [&_img]:my-4 [&_img]:max-w-full',
        // Strong / em
        '[&_strong]:font-semibold',
        '[&_em]:italic',
        // Max width
        'max-w-none',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content_html }}
    />
  );
}
