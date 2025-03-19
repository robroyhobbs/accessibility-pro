import { ScanResult, Violation, PageResult } from '@shared/schema';

/**
 * Generate a random but plausible list of subpages for a given URL
 * This simulates crawling a website to find linked pages
 * 
 * @param baseUrl The base URL of the website
 * @param limit Maximum number of pages to generate
 * @returns An array of page URLs
 */
function getSimulatedSubpages(baseUrl: string, limit: number): string[] {
  // Remove protocol and trailing slashes for cleaner path building
  const cleanBaseUrl = baseUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  
  // Common page paths found on most websites
  const commonPaths = [
    '/about',
    '/contact',
    '/services',
    '/products',
    '/blog',
    '/faq',
    '/privacy-policy',
    '/terms-of-service',
    '/careers',
    '/team',
    '/portfolio',
    '/features',
    '/pricing',
    '/support',
    '/testimonials',
    '/news',
    '/events',
    '/gallery',
  ];
  
  // Always include the base URL as the first page
  const pages = [`https://${cleanBaseUrl}`];
  
  // Add random pages up to the limit
  const shuffledPaths = commonPaths.sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(limit - 1, shuffledPaths.length); i++) {
    pages.push(`https://${cleanBaseUrl}${shuffledPaths[i]}`);
  }
  
  return pages;
}

/**
 * Generate accessibility violations for a single page
 * This creates a variable set of accessibility issues
 * 
 * @returns An array of simulated accessibility violations
 */
function generateViolations(pageUrl: string): Violation[] {
  // Common WCAG issues
  const possibleViolations: Violation[] = [
    {
      id: 'image-alt',
      description: 'Images Without Alt Text',
      impact: 'critical',
      count: Math.floor(Math.random() * 5) + 1,
      wcagLevel: '1.1.1 (Level A)',
      principle: 'Perceivable'
    },
    {
      id: 'color-contrast',
      description: 'Insufficient Color Contrast',
      impact: 'serious',
      count: Math.floor(Math.random() * 7) + 1,
      wcagLevel: '1.4.3 (Level AA)',
      principle: 'Perceivable'
    },
    {
      id: 'keyboard',
      description: 'Elements Not Keyboard Accessible',
      impact: 'serious',
      count: Math.floor(Math.random() * 3) + 1,
      wcagLevel: '2.1.1 (Level A)',
      principle: 'Operable'
    },
    {
      id: 'html-lang',
      description: 'Missing Document Language',
      impact: 'serious',
      count: pageUrl.includes('blog') ? 1 : 0,
      wcagLevel: '3.1.1 (Level A)',
      principle: 'Understandable'
    },
    {
      id: 'heading-order',
      description: 'Improper Heading Structure',
      impact: 'moderate',
      count: Math.floor(Math.random() * 3),
      wcagLevel: '1.3.1 (Level A)',
      principle: 'Perceivable'
    },
    {
      id: 'landmark',
      description: 'Missing Landmark Regions',
      impact: 'moderate',
      count: Math.floor(Math.random() * 2),
      wcagLevel: '1.3.1 (Level A)',
      principle: 'Perceivable'
    },
    {
      id: 'aria-hidden-focus',
      description: 'ARIA Hidden Element Contains Focusable Element',
      impact: 'serious',
      count: Math.floor(Math.random() * 2),
      wcagLevel: '4.1.2 (Level A)',
      principle: 'Robust'
    },
    {
      id: 'label',
      description: 'Form Elements Do Not Have Labels',
      impact: 'critical',
      count: pageUrl.includes('contact') ? Math.floor(Math.random() * 4) + 1 : 0,
      wcagLevel: '3.3.2 (Level A)',
      principle: 'Understandable'
    }
  ];
  
  // Return violations with count > 0
  return possibleViolations.filter(v => v.count > 0);
}

/**
 * Scan a single page for accessibility issues
 * 
 * @param url The URL to scan
 * @returns PageResult with accessibility information for this page
 */
async function scanSinglePage(url: string): Promise<PageResult> {
  // Simulate a short delay for scanning
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get violations for this specific page
  const violations = generateViolations(url);
  
  // Calculate metrics for this page
  const totalChecks = 8;
  const passedChecks = totalChecks - (violations.length > 0 ? violations.length : 0);
  const issueCount = violations.reduce((sum, violation) => sum + violation.count, 0);
  
  // Calculate page score
  let score = 100;
  violations.forEach(violation => {
    const severityFactor = 
      violation.impact === 'critical' ? 4 :
      violation.impact === 'serious' ? 3 :
      violation.impact === 'moderate' ? 2 : 1;
    
    score -= (violation.count * severityFactor) * (100 / (totalChecks * 10));
  });
  
  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  return {
    url,
    score,
    passedChecks,
    issueCount,
    violations
  };
}

/**
 * Combined and deduplicated violations from multiple pages
 * @param allViolations Array of violations from different pages
 * @returns Combined and deduplicated violation list
 */
function combineViolations(allViolations: Violation[]): Violation[] {
  const combinedMap = new Map<string, Violation>();
  
  allViolations.forEach(violation => {
    if (!combinedMap.has(violation.id)) {
      // First time seeing this violation
      combinedMap.set(violation.id, { ...violation });
    } else {
      // Update existing violation count
      const existing = combinedMap.get(violation.id)!;
      existing.count += violation.count;
    }
  });
  
  return Array.from(combinedMap.values());
}

/**
 * A WCAG compliance scanner with multi-page capability
 * This implementation simulates accessibility checks
 * 
 * @param url The base URL to scan
 * @param isMultiPage Whether to scan multiple pages
 * @param scanDepth Maximum number of pages to scan
 * @returns A ScanResult object with simulated accessibility information
 */
export async function scanWebsite(
  url: string, 
  isMultiPage: boolean = false, 
  scanDepth: number = 1
): Promise<ScanResult> {
  try {
    console.log(`Running scanner on URL: ${url} (Multi-page: ${isMultiPage}, Depth: ${scanDepth})`);
    
    // For single page scan
    if (!isMultiPage || scanDepth <= 1) {
      const singlePageResult = await scanSinglePage(url);
      return {
        ...singlePageResult,
        isMultiPage: false,
        pagesScanned: [url]
      };
    }
    
    // For multi-page scan
    const pagesToScan = getSimulatedSubpages(url, scanDepth);
    console.log(`Scanning ${pagesToScan.length} pages:`, pagesToScan);
    
    // Scan each page
    const pageResults: PageResult[] = [];
    for (const pageUrl of pagesToScan) {
      const pageResult = await scanSinglePage(pageUrl);
      pageResults.push(pageResult);
    }
    
    // Aggregate all violations
    const allViolations = pageResults.flatMap(page => page.violations);
    const combinedViolations = combineViolations(allViolations);
    
    // Calculate overall metrics
    const totalChecksPerPage = 8;
    const totalPossibleChecks = totalChecksPerPage * pagesToScan.length;
    const totalPassedChecks = pageResults.reduce((sum, page) => sum + page.passedChecks, 0);
    const totalIssueCount = pageResults.reduce((sum, page) => sum + page.issueCount, 0);
    
    // Calculate overall score (weighted average of page scores)
    const overallScore = Math.round(
      pageResults.reduce((sum, page) => sum + page.score, 0) / pageResults.length
    );
    
    return {
      score: overallScore,
      passedChecks: totalPassedChecks,
      issueCount: totalIssueCount,
      violations: combinedViolations,
      isMultiPage: true,
      pagesScanned: pagesToScan,
      pageResults: pageResults
    };
  } catch (error) {
    console.error('Error during website scanning:', error);
    throw error;
  }
}