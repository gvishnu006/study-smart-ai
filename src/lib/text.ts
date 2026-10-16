export interface MaterialLike {
  title: string;
  text: string;
  chapterName?: string;
}

/**
 * Join the text from several materials into a single context string,
 * distributing a character budget fairly across sources and adding
 * lightweight headers so the model can attribute content.
 */
export function gatherMaterialText(
  materials: MaterialLike[],
  maxChars = 42000
): string {
  const usable = materials.filter((m) => m.text && m.text.trim().length > 0);
  if (usable.length === 0) return "";
  const per = Math.floor(maxChars / usable.length);

  return usable
    .map((m) => {
      const header = m.chapterName
        ? `[Source: ${m.title} — ${m.chapterName}]`
        : `[Source: ${m.title}]`;
      const body =
        m.text.length > per ? `${m.text.slice(0, per)}\n…[truncated]` : m.text;
      return `${header}\n${body}`;
    })
    .join("\n\n---\n\n");
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
