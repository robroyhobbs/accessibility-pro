import { ScanResult, Violation, PageResult, violationSchema } from '@shared/schema';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { scanWebsite as simulatedScan } from './scanner';

/**
 * Find the installed Chrome/Chromium executable on different platforms
 */
async function findChromiumExecutable() {
  // For Replit, we know where Chromium is installed
  return '/nix/store/chromium/bin/chromium';
}

/**
 * Evaluates a page for common WCAG violations directly in the browser context
 * This function runs in the browser via puppeteer's page.evaluate
 */
function evaluateAccessibility() {
  // This code will run in the browser context
  const violations: any[] = [];
  const document = window.document;

  // Function to generate a unique ID for each violation type
  const generateViolationId = (type: string) => {
    return `${type}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Check 1: Images without alt text (WCAG 1.1.1)
  const imagesWithoutAlt = Array.from(document.querySelectorAll('img')).filter(img => {
    return !img.hasAttribute('alt');
  });

  if (imagesWithoutAlt.length > 0) {
    const sampleImg = imagesWithoutAlt[0];
    const parentHTML = sampleImg.parentElement ? sampleImg.parentElement.outerHTML : '';
    
    violations.push({
      id: 'image-alt',
      description: 'Images Without Alt Text',
      impact: 'critical',
      count: imagesWithoutAlt.length,
      wcagLevel: '1.1.1 (Level A)',
      principle: 'Perceivable',
      codeExample: sampleImg.outerHTML,
      recommendation: 'Add descriptive alt text to images that convey information. Use empty alt attributes for decorative images.',
      fixExample: sampleImg.outerHTML.replace('<img', '<img alt="Descriptive text for this image"')
    });
  }

  // Check 2: Check for proper heading structure (WCAG 1.3.1)
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let prevLevel = 0;
  const headingStructureViolations = headings.filter((heading, index) => {
    const level = parseInt(heading.tagName.substring(1));
    
    // First heading should be h1
    if (index === 0 && level !== 1) {
      return true;
    }
    
    // Check for skipped heading levels
    if (index > 0 && level > prevLevel + 1) {
      return true;
    }
    
    prevLevel = level;
    return false;
  });

  if (headingStructureViolations.length > 0) {
    const sampleHeading = headingStructureViolations[0];
    
    violations.push({
      id: 'heading-order',
      description: 'Improper Heading Structure',
      impact: 'moderate',
      count: headingStructureViolations.length,
      wcagLevel: '1.3.1 (Level A)',
      principle: 'Perceivable',
      codeExample: document.body.innerHTML.substring(0, 500), // Get a sample of the document structure
      recommendation: 'Use heading elements in a hierarchical manner, starting with h1 and not skipping levels.',
      fixExample: 'Ensure proper heading structure: <h1>Page Title</h1> followed by <h2>Section</h2> then <h3>Subsection</h3>'
    });
  }

  // Check 3: Check for contrast issues (simplified - would need more advanced analysis in a real implementation)
  const textElements = Array.from(document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, button, label'));
  // This is a simple proxy for contrast issues - in a real implementation, you'd need to calculate color contrast ratios
  const potentialContrastIssues = textElements.filter(el => {
    const style = window.getComputedStyle(el);
    // Very light text colors that might have contrast issues
    const color = style.color.toLowerCase();
    const bgColor = style.backgroundColor.toLowerCase();
    
    return (color.includes('rgb(255, 255, 255)') && bgColor.includes('rgba(0, 0, 0, 0)')) || 
           (color.includes('rgb(211, 211, 211)')) ||
           (color.includes('rgb(169, 169, 169)'));
  });

  if (potentialContrastIssues.length > 0) {
    const sampleElement = potentialContrastIssues[0];
    const style = window.getComputedStyle(sampleElement);
    
    violations.push({
      id: 'color-contrast',
      description: 'Potential Insufficient Color Contrast',
      impact: 'serious',
      count: potentialContrastIssues.length,
      wcagLevel: '1.4.3 (Level AA)',
      principle: 'Perceivable',
      codeExample: `<${sampleElement.tagName.toLowerCase()} style="color: ${style.color}; background-color: ${style.backgroundColor}">
  ${sampleElement.textContent?.substring(0, 100) || 'Text content'}
</${sampleElement.tagName.toLowerCase()}>`,
      recommendation: 'Use a color contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.',
      fixExample: `<${sampleElement.tagName.toLowerCase()} style="color: #595959; background-color: #ffffff">
  ${sampleElement.textContent?.substring(0, 100) || 'Text content'}
</${sampleElement.tagName.toLowerCase()}>`
    });
  }

  // Check 4: Form elements without labels (WCAG 3.3.2)
  const formInputs = Array.from(document.querySelectorAll('input, select, textarea'));
  const inputsWithoutLabels = formInputs.filter(input => {
    const id = input.getAttribute('id');
    // Check if there's a label with a "for" attribute pointing to this input
    return id && !document.querySelector(`label[for="${id}"]`);
  });

  if (inputsWithoutLabels.length > 0) {
    const sampleInput = inputsWithoutLabels[0];
    
    violations.push({
      id: 'label',
      description: 'Form Elements Do Not Have Labels',
      impact: 'critical',
      count: inputsWithoutLabels.length,
      wcagLevel: '3.3.2 (Level A)',
      principle: 'Understandable',
      codeExample: sampleInput.outerHTML,
      recommendation: 'Associate labels with their form controls using the "for" attribute that matches the input\'s id.',
      fixExample: `<label for="${sampleInput.id || 'sample-id'}">Descriptive Label</label>
${sampleInput.outerHTML}`
    });
  }

  // Check 5: HTML language (WCAG 3.1.1)
  const html = document.querySelector('html');
  if (!html || !html.hasAttribute('lang')) {
    violations.push({
      id: 'html-lang',
      description: 'Missing Document Language',
      impact: 'serious',
      count: 1,
      wcagLevel: '3.1.1 (Level A)',
      principle: 'Understandable',
      codeExample: `<html>
  <head>...</head>
  <body>...</body>
</html>`,
      recommendation: 'Specify the language of your document using the lang attribute on the html element.',
      fixExample: `<html lang="en">
  <head>...</head>
  <body>...</body>
</html>`
    });
  }

  // Check 6: Check for keyboard accessibility issues (WCAG 2.1.1)
  const clickableElements = Array.from(document.querySelectorAll('[onclick], [onmousedown], [onmouseup]'));
  const divButtons = Array.from(document.querySelectorAll('div')).filter(div => {
    const style = window.getComputedStyle(div);
    return (
      div.textContent && 
      (div.textContent.toLowerCase().includes('button') || 
       div.textContent.toLowerCase().includes('submit') || 
       div.textContent.toLowerCase().includes('click'))
    ) && !div.hasAttribute('tabindex') && !div.hasAttribute('role');
  });

  const keyboardIssues = [...clickableElements, ...divButtons];
  
  if (keyboardIssues.length > 0) {
    const sampleElement = keyboardIssues[0];
    
    violations.push({
      id: 'keyboard',
      description: 'Elements Not Keyboard Accessible',
      impact: 'serious',
      count: keyboardIssues.length,
      wcagLevel: '2.1.1 (Level A)',
      principle: 'Operable',
      codeExample: sampleElement.outerHTML,
      recommendation: 'Ensure all interactive elements are accessible via keyboard. Use appropriate elements like buttons instead of divs for interactive components.',
      fixExample: sampleElement.tagName.toLowerCase() === 'div' ? 
        `<button type="button">${sampleElement.innerHTML}</button>` : 
        `${sampleElement.outerHTML.replace('>', ' tabindex="0" role="button" onkeydown="if(event.key===\'Enter\')this.click()" >')}`
    });
  }

  // Check 7: ARIA roles and attributes
  const elementsWithAria = Array.from(document.querySelectorAll('[aria-*]'));
  const invalidAriaUsage = elementsWithAria.filter(el => {
    // Check for aria-hidden on focusable elements
    if (el.getAttribute('aria-hidden') === 'true') {
      const focusableSelectors = 'a, button, input, select, textarea, [tabindex]';
      if (el.matches(focusableSelectors) || el.querySelector(focusableSelectors)) {
        return true;
      }
    }
    return false;
  });

  if (invalidAriaUsage.length > 0) {
    const sampleElement = invalidAriaUsage[0];
    
    violations.push({
      id: 'aria-hidden-focus',
      description: 'ARIA Hidden Element Contains Focusable Element',
      impact: 'serious',
      count: invalidAriaUsage.length,
      wcagLevel: '4.1.2 (Level A)',
      principle: 'Robust',
      codeExample: sampleElement.outerHTML,
      recommendation: 'Do not include focusable elements inside elements with aria-hidden="true".',
      fixExample: sampleElement.outerHTML.replace('aria-hidden="true"', '')
    });
  }

  // Calculate metrics
  const totalChecks = 7; // Number of different checks we perform
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
    violations,
    passedChecks,
    issueCount,
    score
  };
}

/**
 * Scan a single page for accessibility issues using Puppeteer
 * 
 * @param url The URL to scan
 * @param browser The Puppeteer browser instance
 * @returns PageResult with accessibility information for this page
 */
async function scanSinglePageWithPuppeteer(url: string, browser: any): Promise<PageResult> {
  console.log(`Scanning page: ${url}`);
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport size for a realistic view
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL with timeout
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000
    });
    
    // Wait for the page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Take a screenshot for reference (optional)
    // await page.screenshot({ path: `screenshot-${new URL(url).hostname}.png` });
    
    // Run the accessibility evaluation in the browser context
    const result = await page.evaluate(evaluateAccessibility);
    
    // Close the page to free up resources
    await page.close();
    
    // Format the result according to our schema
    return {
      url,
      score: result.score,
      passedChecks: result.passedChecks,
      issueCount: result.issueCount,
      violations: result.violations
    };
  } catch (error) {
    console.error(`Error scanning ${url}:`, error);
    // In case of error, return a default PageResult with error information
    return {
      url,
      score: 0,
      passedChecks: 0,
      issueCount: 1,
      violations: [{
        id: 'scan-error',
        description: `Error scanning page: ${(error as Error).message}`,
        impact: 'critical',
        count: 1,
        wcagLevel: 'N/A',
        principle: 'N/A'
      }]
    };
  }
}

/**
 * An enhanced WCAG compliance scanner using Puppeteer for real browser rendering
 * 
 * @param url The base URL to scan
 * @param isMultiPage Whether to scan multiple pages
 * @param scanDepth Maximum number of pages to scan
 * @returns A ScanResult object with accessibility information
 */
export async function scanWebsiteWithPuppeteer(
  url: string, 
  isMultiPage: boolean = false, 
  scanDepth: number = 1
): Promise<ScanResult> {
  let browser;
  
  try {
    console.log(`Running enhanced scanner on URL: ${url} (Multi-page: ${isMultiPage}, Depth: ${scanDepth})`);
    
    // Find the Chromium executable path
    const executablePath = await findChromiumExecutable();
    console.log(`Using Chromium at: ${executablePath}`);
    
    // Launch a headless browser
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    // For single page scan
    if (!isMultiPage || scanDepth <= 1) {
      const singlePageResult = await scanSinglePageWithPuppeteer(url, browser);
      return {
        ...singlePageResult,
        isMultiPage: false,
        pagesScanned: [url]
      };
    }
    
    // For multi-page scan, we need to first discover the pages
    // For now, we'll use the same simulated subpages approach from the original scanner
    // In a real implementation, we would crawl links from the actual website
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Extract links from the page
    const links = await page.evaluate(() => {
      const uniqueUrls = new Set<string>();
      const baseUrl = window.location.origin;
      const hostname = window.location.hostname;
      
      // Get all links on the page
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      
      anchors.forEach(anchor => {
        let href = anchor.getAttribute('href') || '';
        
        // Skip empty hrefs, javascript:, mailto:, tel:, etc.
        if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || 
            href.startsWith('tel:') || href.startsWith('#')) {
          return;
        }
        
        // Convert relative URLs to absolute
        if (href.startsWith('/')) {
          href = baseUrl + href;
        } else if (!href.startsWith('http')) {
          href = baseUrl + '/' + href;
        }
        
        // Only include URLs from the same domain
        const urlObj = new URL(href);
        if (urlObj.hostname === hostname) {
          uniqueUrls.add(href);
        }
      });
      
      return Array.from(uniqueUrls);
    });
    
    await page.close();
    
    // Limit the number of pages to scan based on scanDepth
    const pagesToScan = [url, ...links.slice(0, scanDepth - 1)];
    console.log(`Found ${links.length} links, scanning ${pagesToScan.length} pages:`, pagesToScan);
    
    // Scan each page
    const pageResults: PageResult[] = [];
    for (const pageUrl of pagesToScan) {
      const pageResult = await scanSinglePageWithPuppeteer(pageUrl, browser);
      pageResults.push(pageResult);
    }
    
    // Aggregate all violations
    const allViolations = pageResults.flatMap(page => page.violations);
    
    // Combine similar violations (same ID)
    const violationMap = new Map<string, Violation>();
    allViolations.forEach(violation => {
      if (!violationMap.has(violation.id)) {
        violationMap.set(violation.id, { ...violation });
      } else {
        const existing = violationMap.get(violation.id)!;
        existing.count += violation.count;
      }
    });
    const combinedViolations = Array.from(violationMap.values());
    
    // Calculate overall metrics
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
    console.error('Error during website scanning with Puppeteer:', error);
    
    // If Puppeteer fails, fall back to the simulated scanner
    console.log('Falling back to simulated scanner...');
    return simulatedScan(url, isMultiPage, scanDepth);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * A combined scanner that tries to use Puppeteer first, then falls back to simulation
 * 
 * @param url The base URL to scan
 * @param isMultiPage Whether to scan multiple pages
 * @param scanDepth Maximum number of pages to scan
 * @returns A ScanResult object with accessibility information
 */
export async function scanWebsite(
  url: string, 
  isMultiPage: boolean = false, 
  scanDepth: number = 1
): Promise<ScanResult> {
  try {
    // Try the enhanced scanner first
    return await scanWebsiteWithPuppeteer(url, isMultiPage, scanDepth);
  } catch (error) {
    console.error('Enhanced scanner failed, falling back to simulated scanner:', error);
    // Fall back to the simulated scanner if the enhanced one fails
    return simulatedScan(url, isMultiPage, scanDepth);
  }
}