/**
 * Utility functions for file operations
 */

/**
 * Downloads code as a file
 * @param {string} code - The code content to download
 * @param {string} filename - The filename to use
 */
export function downloadCode(code, filename) {
  if (!code) {
    alert('Please translate the code first');
    return;
  }

  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies code to clipboard
 * @param {string} code - The code to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(code) {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Gets file extension for a language
 * @param {string} language - The programming language
 * @returns {string} - File extension
 */
export function getFileExtension(language) {
  const extensions = {
    'java': 'java',
    'c': 'c',
    'python': 'py'
  };
  return extensions[language.toLowerCase()] || 'txt';
}
