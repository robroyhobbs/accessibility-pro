import puppeteer from 'puppeteer';
import { ScanResult, Violation } from '@shared/schema';

/**
 * A more comprehensive and accurate WCAG compliance scanner
 * This implementation performs real checks on the DOM structure and CSS properties
 * to identify common accessibility issues
 * 
 * @param url The URL to scan
 * @returns A ScanResult object with detailed accessibility information
 */
export async function scanWebsite(url: string): Promise<ScanResult> {
  let browser;
  
  try {
    // Launch a headless browser with appropriate settings for accessibility scanning
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
    
    // Open a new page
    const page = await browser.newPage();
    
    // Set timeout for navigation (15 seconds to allow for slower sites)
    await page.setDefaultNavigationTimeout(15000);
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // ===== Perform accessibility checks =====
    const violations: Violation[] = [];
    let totalChecks = 0;
    let passedChecks = 0;
    
    // 1. Check for images without alt text
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => 
        !img.hasAttribute('alt') || 
        img.getAttribute('alt') === ''
      ).length;
    });
    
    totalChecks++;
    if (imagesWithoutAlt > 0) {
      violations.push({
        id: 'image-alt',
        description: 'Images Without Alt Text',
        impact: 'critical',
        count: imagesWithoutAlt,
        wcagLevel: '1.1.1 (Level A)',
        principle: 'Perceivable'
      });
    } else {
      passedChecks++;
    }
    
    // 2. Check for form controls without labels
    const formsWithoutLabels = await page.evaluate(() => {
      const formControls = Array.from(document.querySelectorAll('input, select, textarea'));
      return formControls.filter(control => {
        // Skip hidden, submit and button inputs
        if (control instanceof HTMLInputElement && 
            (control.type === 'hidden' || control.type === 'submit' || control.type === 'button')) {
          return false;
        }
        
        // Check if it has an id and a corresponding label
        const id = control.getAttribute('id');
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return false;
        }
        
        // Check if it's wrapped in a label
        const parent = control.parentElement;
        if (parent && parent.tagName === 'LABEL') return false;
        
        // Check for aria-label or aria-labelledby
        if (control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) {
          return false;
        }
        
        return true;
      }).length;
    });
    
    totalChecks++;
    if (formsWithoutLabels > 0) {
      violations.push({
        id: 'label',
        description: 'Form Controls Without Labels',
        impact: 'critical',
        count: formsWithoutLabels,
        wcagLevel: '3.3.2 (Level A)',
        principle: 'Understandable'
      });
    } else {
      passedChecks++;
    }
    
    // 3. Check for proper heading hierarchy
    const headingOrder = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let violations = 0;
      let previousLevel = 0;
      
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        
        // First heading should be h1
        if (previousLevel === 0 && level !== 1) {
          violations++;
        }
        
        // Heading levels shouldn't skip (e.g., h1 to h3)
        if (previousLevel > 0 && level > previousLevel && level - previousLevel > 1) {
          violations++;
        }
        
        previousLevel = level;
      });
      
      return violations;
    });
    
    totalChecks++;
    if (headingOrder > 0) {
      violations.push({
        id: 'heading-order',
        description: 'Improper Heading Structure',
        impact: 'moderate',
        count: headingOrder,
        wcagLevel: '1.3.1 (Level A)',
        principle: 'Perceivable'
      });
    } else {
      passedChecks++;
    }
    
    // 4. Check for color contrast issues (simplified version)
    const contrastIssues = await page.evaluate(() => {
      // Helper function to calculate relative luminance
      function getLuminance(r: number, g: number, b: number): number {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }
      
      // Helper function to calculate contrast ratio
      function getContrastRatio(rgb1: number[], rgb2: number[]): number {
        const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      }
      
      // Helper to convert hex to RGB
      function hexToRgb(hex: string): number[] {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m: string, r: string, g: string, b: string) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ] : [0, 0, 0];
      }
      
      // Get computed style of an element
      function getRgbFromComputedStyle(color: string): number[] {
        // Extract RGB values from computed style
        const match = color.match(/\d+/g);
        if (match && match.length >= 3) {
          return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
        }
        // Default to black if color format is not recognized
        return [0, 0, 0];
      }
      
      // Check visible text elements for contrast
      const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label'));
      let contrastIssues = 0;
      
      textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        
        // Skip elements with no text or invisible elements
        if (!element.textContent?.trim() || style.display === 'none' || style.visibility === 'hidden') {
          return;
        }
        
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        // Skip if background is transparent - this is an approximation
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
          return;
        }
        
        const textRgb = getRgbFromComputedStyle(color);
        const bgRgb = getRgbFromComputedStyle(bgColor);
        const ratio = getContrastRatio(textRgb, bgRgb);
        
        // Check if the ratio meets WCAG 2.0 AA standards (4.5:1 for normal text)
        const fontSize = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight) >= 700;
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
        
        if ((isLargeText && ratio < 3) || (!isLargeText && ratio < 4.5)) {
          contrastIssues++;
        }
      });
      
      return contrastIssues;
    });
    
    totalChecks++;
    if (contrastIssues > 0) {
      violations.push({
        id: 'color-contrast',
        description: 'Insufficient Color Contrast',
        impact: 'serious',
        count: Math.min(contrastIssues, 25), // Cap at 25 to prevent overwhelming the report
        wcagLevel: '1.4.3 (Level AA)',
        principle: 'Perceivable'
      });
    } else {
      passedChecks++;
    }
    
    // 5. Check for keyboard accessibility
    const keyboardIssues = await page.evaluate(() => {
      const interactiveElements = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"]'));
      let violations = 0;
      
      interactiveElements.forEach(element => {
        const style = window.getComputedStyle(element);
        
        // Skip hidden elements
        if (style.display === 'none' || style.visibility === 'hidden') {
          return;
        }
        
        // Check if the element has a tabindex of -1 and isn't otherwise hidden
        if (element.getAttribute('tabindex') === '-1') {
          violations++;
        }
        
        // Check for event handlers that suggest mouse-only interaction
        const hasMouseEvents = element.getAttribute('onclick') || 
                               element.getAttribute('onmouseover') || 
                               element.getAttribute('onmouseout');
        
        const hasKeyboardEvents = element.getAttribute('onkeydown') || 
                                  element.getAttribute('onkeyup') || 
                                  element.getAttribute('onkeypress');
        
        // If it has mouse events but no keyboard events, it's potentially not keyboard accessible
        if (hasMouseEvents && !hasKeyboardEvents) {
          violations++;
        }
      });
      
      return violations;
    });
    
    totalChecks++;
    if (keyboardIssues > 0) {
      violations.push({
        id: 'keyboard',
        description: 'Elements Not Keyboard Accessible',
        impact: 'serious',
        count: keyboardIssues,
        wcagLevel: '2.1.1 (Level A)',
        principle: 'Operable'
      });
    } else {
      passedChecks++;
    }
    
    // 6. Check for missing document language
    const documentLanguage = await page.evaluate(() => {
      return document.documentElement.hasAttribute('lang');
    });
    
    totalChecks++;
    if (!documentLanguage) {
      violations.push({
        id: 'html-lang',
        description: 'Missing Document Language',
        impact: 'serious',
        count: 1,
        wcagLevel: '3.1.1 (Level A)',
        principle: 'Understandable'
      });
    } else {
      passedChecks++;
    }
    
    // 7. Check for page title
    const pageTitle = await page.evaluate(() => {
      return document.title.trim() !== '';
    });
    
    totalChecks++;
    if (!pageTitle) {
      violations.push({
        id: 'document-title',
        description: 'Missing Page Title',
        impact: 'serious',
        count: 1,
        wcagLevel: '2.4.2 (Level A)',
        principle: 'Operable'
      });
    } else {
      passedChecks++;
    }
    
    // Calculate overall score
    // The score is weighted - more severe issues impact the score more heavily
    const issueCount = violations.reduce((sum, v) => sum + v.count, 0);
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
      score,
      passedChecks,
      issueCount,
      violations
    };
  } catch (error) {
    console.error('Error during website scanning:', error);
    throw error;
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
}
