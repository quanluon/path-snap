/**
 * Formats text description to handle line breaks and special characters
 * @param text - The text to format
 * @returns Formatted text with proper line breaks
 */
export function formatDescription(text: string): string {
  if (!text) return '';
  
  // Replace \r\n, \r, and \n with proper line breaks
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '\n')
    .trim();
}

/**
 * Renders formatted description with proper line breaks
 * @param text - The text to render
 * @returns JSX element with formatted text
 */
export function renderFormattedDescription(text: string): React.ReactNode {
  if (!text) return null;
  
  const formattedText = formatDescription(text);
  const lines = formattedText.split('\n');
  
  return (
    <>
      {lines.map((line: string, index: number) => (
        <span key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}
