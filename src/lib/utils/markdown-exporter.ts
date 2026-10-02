/**
 * Downloads a string content as a Markdown (.md) file in the browser.
 */
export function downloadMarkdown(content: string, filename: string = 'devqa-output.md'): void {
  if (typeof window === 'undefined') return;

  const cleanFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
