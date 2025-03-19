/**
 * Validates if a given string is a properly formatted URL
 * @param url The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a URL can be safely scanned
 * Prevents scanning of localhost, internal IPs, etc.
 * @param url The URL to check
 * @returns true if the URL is safe to scan, false otherwise
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Check for localhost
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      return false;
    }
    
    // Check for internal IP ranges
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(parsedUrl.hostname)) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}
