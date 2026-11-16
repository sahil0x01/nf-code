// Wrap a value in single quotes so the shell treats it as one literal word.
export function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

// Keep the start and the end of long output; errors usually sit at the end.
export function truncateOutput(text: string, maxChars = 20_000): string {
  if (text.length <= maxChars) return text;
  const half = Math.floor(maxChars / 2);
  const omitted = text.length - maxChars;
  return `${text.slice(0, half)}\n[... ${omitted} characters omitted ...]\n${text.slice(-half)}`;
}
