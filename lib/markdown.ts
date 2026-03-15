function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(text: string): string {
  // Preserve code spans first
  const codeSpans: string[] = [];
  const withCodePlaceholders = text.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
    return `\x00CODE${codeSpans.length - 1}\x00`;
  });

  let result = withCodePlaceholders
    // Images before links
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="inline-image" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Restore code spans
  result = result.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeSpans[parseInt(i)]);
  return result;
}

export function parseMarkdown(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeLines: string[] = [];
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        if (inList) {
          html += `</${listType}>\n`;
          inList = false;
        }
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim() || 'text';
        codeLines = [];
      } else {
        inCodeBlock = false;
        const escaped = escapeHtml(codeLines.join('\n'));
        html += `<pre class="code-block"><code class="language-${codeBlockLang}">${escaped}</code></pre>\n`;
        codeLines = [];
        codeBlockLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (inList) {
        html += `</${listType}>\n`;
        inList = false;
      }
      continue;
    }

    // Headers
    const h3 = line.match(/^### (.+)$/);
    if (h3) { html += `<h3>${inlineMarkdown(h3[1])}</h3>\n`; continue; }
    const h2 = line.match(/^## (.+)$/);
    if (h2) { html += `<h2>${inlineMarkdown(h2[1])}</h2>\n`; continue; }
    const h1 = line.match(/^# (.+)$/);
    if (h1) { html += `<h1>${inlineMarkdown(h1[1])}</h1>\n`; continue; }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) { html += `</${listType}>\n`; inList = false; }
      html += `<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>\n`;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      if (inList) { html += `</${listType}>\n`; inList = false; }
      html += '<hr />\n';
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+] (.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) html += `</${listType}>\n`;
        html += '<ul>\n';
        inList = true;
        listType = 'ul';
      }
      html += `<li>${inlineMarkdown(ulMatch[1])}</li>\n`;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\. (.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) html += `</${listType}>\n`;
        html += '<ol>\n';
        inList = true;
        listType = 'ol';
      }
      html += `<li>${inlineMarkdown(olMatch[1])}</li>\n`;
      continue;
    }

    // Task list item
    const taskMatch = line.match(/^- \[([ x])\] (.+)$/);
    if (taskMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) html += `</${listType}>\n`;
        html += '<ul class="task-list">\n';
        inList = true;
        listType = 'ul';
      }
      const checked = taskMatch[1] === 'x' ? 'checked' : '';
      html += `<li class="task-item"><input type="checkbox" ${checked} disabled /> ${inlineMarkdown(taskMatch[2])}</li>\n`;
      continue;
    }

    // Close list before paragraph
    if (inList) {
      html += `</${listType}>\n`;
      inList = false;
    }

    // Paragraph
    html += `<p>${inlineMarkdown(line)}</p>\n`;
  }

  if (inList) html += `</${listType}>\n`;

  return html;
}
