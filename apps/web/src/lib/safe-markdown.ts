/** Small, bounded Markdown subset. Render these nodes through normal React text
 * children/elements; never use innerHTML. Raw HTML and images remain plain text.
 * No HTML string, entity decoding, style, iframe or executable URI is produced. */
export type MarkdownInline = { type: 'text' | 'code' | 'strong' | 'emphasis'; text: string } | { type: 'link'; text: string; href: string };
export type MarkdownBlock = { type: 'paragraph'; content: MarkdownInline[] } | { type: 'heading'; level: 1 | 2 | 3; content: MarkdownInline[] }
  | { type: 'code'; text: string } | { type: 'list'; items: MarkdownInline[][] };
export function safeMarkdownLink(value: string): string | null {
  if (!value || value.length > 2048 || [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '\\')) return null;
  if (value.startsWith('#')) return value;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
function inline(source: string): MarkdownInline[] {
  const result: MarkdownInline[] = []; let last = 0;
  const pattern = /(?<!!)\[([^\]\n]{1,500})\]\(([^)\s]{1,2048})\)|`([^`\n]{1,2000})`|\*\*([^*\n]{1,2000})\*\*|\*([^*\n]{1,2000})\*/g;
  for (const match of source.matchAll(pattern)) {
    if (match.index > last) result.push({ type: 'text', text: source.slice(last, match.index) });
    if (match[1] !== undefined) {
      const href = safeMarkdownLink(match[2]!);
      result.push(href ? { type: 'link', text: match[1], href } : { type: 'text', text: match[0] });
    } else result.push({ type: match[3] !== undefined ? 'code' : match[4] !== undefined ? 'strong' : 'emphasis', text: match[3] ?? match[4] ?? match[5]! });
    last = match.index + match[0].length;
  }
  if (last < source.length) result.push({ type: 'text', text: source.slice(last) });
  return result;
}
export function parseSafeMarkdown(source: string): MarkdownBlock[] {
  // API descriptions are limited to 20,000 UTF-16 code units. Bound callers too.
  const lines = source.slice(0, 20000).replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const blocks: MarkdownBlock[] = []; let paragraph: string[] = []; let list: MarkdownInline[][] = []; let code: string[] | null = null;
  const flush = () => { if (paragraph.length) { blocks.push({ type: 'paragraph', content: inline(paragraph.join('\n')) }); paragraph = []; } if (list.length) { blocks.push({ type: 'list', items: list }); list = []; } };
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (code !== null) { blocks.push({ type: 'code', text: code.join('\n') }); code = null; }
      else { flush(); code = []; } continue;
    }
    if (code !== null) { code.push(line); continue; }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line); const item = /^[-*]\s+(.+)$/.exec(line);
    if (heading) { flush(); blocks.push({ type: 'heading', level: heading[1]!.length as 1 | 2 | 3, content: inline(heading[2]!) }); }
    else if (item) { if (paragraph.length) flush(); list.push(inline(item[1]!)); }
    else if (!line.trim()) flush();
    else { if (list.length) flush(); paragraph.push(line); }
  }
  if (code !== null) blocks.push({ type: 'code', text: code.join('\n') });
  flush(); return blocks;
}
