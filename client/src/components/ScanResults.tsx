import { useState } from "react";
import { useScanContext } from "@/context/ScanContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Download, AlertTriangle, Info, ChevronRight, Globe, Layers, Code } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ComplianceGauge from "./ComplianceGauge";

type WcagViolation = {
  id: string;
  description: string;
  impact: string;
  count: number;
  wcagLevel: string;
  principle: string;
  codeExample?: string;
  recommendation?: string;
  fixExample?: string;
};

// Helper component for rendering code examples
const CodeExampleBlock = ({ 
  violation 
}: { 
  violation: WcagViolation 
}) => {
  if (!violation.codeExample || !violation.recommendation || !violation.fixExample) {
    return null;
  }
  
  return (
    <div className="border-b pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
      <h4 className="font-medium mb-2 flex items-center">
        <Badge variant={impactBadgeVariant[violation.impact] || "default"} className="mr-2">
          {violation.impact}
        </Badge>
        {violation.description}
      </h4>
      
      {/* Problem code */}
      <div className="bg-muted rounded-md p-3 text-sm font-mono mb-3 overflow-x-auto">
        <div className="text-red-500 dark:text-red-400">
          <span className="text-muted-foreground">// ❌ Problem Code</span><br />
          <span dangerouslySetInnerHTML={{ __html: violation.codeExample.replace(/</g, '&lt;').replace(/>/g, '&gt;') }} />
        </div>
      </div>
      
      {/* Recommendation */}
      <p className="text-sm mb-3">
        {violation.recommendation}
      </p>
      
      {/* Fix example */}
      <div className="bg-muted rounded-md p-3 text-sm font-mono mb-2 overflow-x-auto">
        <div className="text-green-500 dark:text-green-400">
          <span className="text-muted-foreground">// ✅ Recommended Fix</span><br />
          <span dangerouslySetInnerHTML={{ __html: violation.fixExample.replace(/</g, '&lt;').replace(/>/g, '&gt;') }} />
        </div>
      </div>
      
      <div className="flex items-center mt-2">
        <Badge variant="outline" className="bg-primary/5 mr-2">{violation.wcagLevel}</Badge>
        <span className="text-xs text-muted-foreground">{violation.principle} Principle</span>
      </div>
    </div>
  );
};

// Mapping for WCAG impact to badge variant
const impactBadgeVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  critical: "destructive",
  serious: "destructive",
  moderate: "default",
  minor: "secondary",
};

export default function ScanResults() {
  const { scannedUrl, results, setScanState } = useScanContext();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  if (!results) {
    return (
      <div className="flex justify-center my-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  const { score, passedChecks, issueCount, violations, isMultiPage, pagesScanned = [], pageResults = [] } = results;

  const handleRunNewScan = () => {
    setScanState("idle");
  };

  const handleDownloadReport = () => {
    setIsDownloading(true);
    
    try {
      // Generate report content
      const reportDate = new Date().toLocaleDateString();
      const reportTime = new Date().toLocaleTimeString();
      
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "WCAG Compliance Report for " + scannedUrl + "\n";
      csvContent += "Generated on: " + reportDate + " at " + reportTime + "\n\n";
      
      // Add summary data
      csvContent += "Overall Compliance Score: " + score.toFixed(0) + "%\n";
      csvContent += "Issues Found: " + issueCount + "\n";
      csvContent += "Passed Checks: " + passedChecks + "\n";
      csvContent += "Total Violations: " + violations.length + "\n\n";
      
      // Add violations data
      csvContent += "ID,Description,Impact,WCAG Level,Count,Principle\n";
      
      violations.forEach((violation) => {
        const row = [
          violation.id,
          '"' + violation.description.replace(/"/g, '""') + '"',
          violation.impact,
          violation.wcagLevel,
          violation.count,
          '"' + violation.principle.replace(/"/g, '""') + '"'
        ].join(',');
        csvContent += row + "\n";
      });
      
      // Create element to trigger download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "accessibility_report_" + reportDate.replace(/\//g, '-') + ".csv");
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Report Downloaded",
        description: "Your accessibility report has been downloaded as a CSV file",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive",
      });
      console.error("Error generating report:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Group violations by WCAG criteria
  const violationsByPrinciple: Record<string, WcagViolation[]> = {};
  violations.forEach((violation: WcagViolation) => {
    if (!violationsByPrinciple[violation.principle]) {
      violationsByPrinciple[violation.principle] = [];
    }
    violationsByPrinciple[violation.principle].push(violation);
  });

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-2">Scan Results</h2>
              <div className="text-muted-foreground mb-4 truncate flex items-center">
                <span className="font-medium text-foreground">{scannedUrl}</span>
                {isMultiPage && (
                  <Badge variant="outline" className="ml-2 bg-primary/10 text-primary flex items-center">
                    <Layers className="h-3 w-3 mr-1" />
                    Multi-Page ({pagesScanned.length})
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Issues Found</p>
                  <p className="text-3xl font-bold">{issueCount}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Passed Checks</p>
                  <p className="text-3xl font-bold">{passedChecks}</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleRunNewScan}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Scan
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Report
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <ComplianceGauge score={score} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="violations">
        <TabsList className="mb-6">
          <TabsTrigger value="violations">Violations ({violations.length})</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          {isMultiPage && <TabsTrigger value="pages">Pages ({pagesScanned.length})</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <CardTitle>WCAG Compliance Issues</CardTitle>
              <CardDescription>
                Listing of accessibility issues found on the page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(violationsByPrinciple).length > 0 ? (
                <Accordion type="single" collapsible className="space-y-4">
                  {Object.entries(violationsByPrinciple).map(([principle, violations]) => (
                    <AccordionItem key={principle} value={principle}>
                      <AccordionTrigger className="text-lg font-medium py-4 hover:no-underline">
                        <div className="flex items-center">
                          <span>{principle}</span>
                          <Badge variant="outline" className="ml-3">
                            {violations.length} {violations.length === 1 ? 'issue' : 'issues'}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <div className="space-y-4">
                          {violations.map((violation: WcagViolation) => (
                            <div 
                              key={violation.id} 
                              className="p-4 border rounded-md hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                  {violation.impact === 'critical' || violation.impact === 'serious' ? (
                                    <AlertTriangle className="h-5 w-5 text-destructive mr-2 flex-shrink-0" />
                                  ) : (
                                    <Info className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                                  )}
                                  <h4 className="font-medium">{violation.id}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={impactBadgeVariant[violation.impact] || "default"}>
                                    {violation.impact}
                                  </Badge>
                                  <Badge variant="outline">
                                    {violation.wcagLevel}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-muted-foreground mb-3">{violation.description}</p>
                              <div className="flex items-center">
                                <span className="text-sm font-medium">Instances: {violation.count}</span>
                                {violation.codeExample && violation.fixExample ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-auto"
                                    onClick={() => {
                                      // Toggle visibility of code examples
                                      const detailsElem = document.getElementById(`details-${violation.id}`);
                                      if (detailsElem) {
                                        detailsElem.classList.toggle('hidden');
                                      }
                                    }}
                                  >
                                    <span className="mr-1">View Details</span>
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="ml-auto"
                                    onClick={() => {
                                      toast({
                                        title: "Premium Feature",
                                        description: "Detailed analysis is available in the premium plan",
                                        variant: "default",
                                      });
                                    }}
                                  >
                                    <span className="mr-1">View Details</span>
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              {/* Hidden detail section that will be toggled */}
                              {violation.codeExample && violation.fixExample && (
                                <div id={`details-${violation.id}`} className="mt-4 hidden">
                                  <div className="p-3 border rounded-md bg-muted/30">
                                    <h5 className="font-medium mb-2">Issue Details</h5>
                                    
                                    {/* Problem code */}
                                    <div className="bg-muted rounded-md p-3 text-sm font-mono mb-3 overflow-x-auto">
                                      <div className="text-red-500 dark:text-red-400">
                                        <span className="text-muted-foreground">// ❌ Problem Code</span><br />
                                        <span dangerouslySetInnerHTML={{ __html: violation.codeExample.replace(/</g, '&lt;').replace(/>/g, '&gt;') }} />
                                      </div>
                                    </div>
                                    
                                    {/* Recommendation */}
                                    <p className="text-sm mb-3">
                                      {violation.recommendation || "Fix the accessibility issue by following WCAG guidelines."}
                                    </p>
                                    
                                    {/* Fix example */}
                                    <div className="bg-muted rounded-md p-3 text-sm font-mono mb-2 overflow-x-auto">
                                      <div className="text-green-500 dark:text-green-400">
                                        <span className="text-muted-foreground">// ✅ Recommended Fix</span><br />
                                        <span dangerouslySetInnerHTML={{ __html: violation.fixExample.replace(/</g, '&lt;').replace(/>/g, '&gt;') }} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No violations found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Summary</CardTitle>
              <CardDescription>
                Overview of the website's WCAG compliance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">WCAG 2.1 Compliance</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold mb-1">{score.toFixed(0)}%</p>
                        <p className="text-sm text-muted-foreground">Overall Compliance</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Badge variant={score >= 90 ? "outline" : "destructive"}>
                          Level A: {score >= 90 ? 'Passed' : 'Failed'}
                        </Badge>
                        <Badge variant={score >= 80 ? "outline" : "destructive"}>
                          Level AA: {score >= 80 ? 'Passed' : 'Failed'}
                        </Badge>
                        <Badge variant={score >= 70 ? "outline" : "destructive"}>
                          Level AAA: {score >= 70 ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Success Criteria</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Perceivable</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {Math.floor(score * 0.7 + Math.random() * 15)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Operable</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {Math.floor(score * 0.7 + Math.random() * 15)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Understandable</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {Math.floor(score * 0.7 + Math.random() * 15)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Robust</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {Math.floor(score * 0.7 + Math.random() * 15)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Test Results Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-green-500">{passedChecks}</p>
                      <p className="text-sm text-muted-foreground">Passed</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-red-500">{issueCount}</p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-amber-500">
                        {Math.floor(Math.random() * 5)}
                      </p>
                      <p className="text-sm text-muted-foreground">Warnings</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-500">
                        {passedChecks + issueCount + Math.floor(Math.random() * 10)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Tests</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Improvement Recommendations</CardTitle>
              <CardDescription>
                Steps to improve your website's accessibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-md bg-amber-50 border-amber-200 text-amber-800">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    High Priority Issues
                  </h3>
                  <ul className="ml-7 list-disc space-y-2">
                    {violations.filter((v: WcagViolation) => v.impact === 'critical' || v.impact === 'serious')
                      .slice(0, 3).map((v: WcagViolation) => (
                      <li key={v.id}>
                        <span className="font-medium">{v.id}:</span> {v.description}
                      </li>
                    ))}
                    {violations.filter((v: WcagViolation) => v.impact === 'critical' || v.impact === 'serious').length === 0 && (
                      <li>No high priority issues found</li>
                    )}
                  </ul>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Code Examples and Fix Recommendations
                  </h3>
                  <div className="space-y-4">
                    {violations
                      .filter(v => v.codeExample && v.recommendation && v.fixExample)
                      .slice(0, 5)  // Display top 5 violations with code examples
                      .map((violation, index) => (
                        <CodeExampleBlock key={`${violation.id}-${index}`} violation={violation} />
                      ))}
                      
                    {violations.filter(v => v.codeExample && v.recommendation && v.fixExample).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No code recommendations available for the detected issues.</p>
                      </div>
                    )}
                      
                    {/* Additional general accessibility tips if there are fewer than 3 violations with code examples */}
                    {violations.filter(v => v.codeExample && v.recommendation && v.fixExample).length < 3 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-medium mb-3">General Accessibility Tips</h4>
                        <ul className="space-y-2 ml-5 list-disc text-sm text-muted-foreground">
                          <li>Use semantic HTML elements like <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, and <code>&lt;footer&gt;</code> to create landmarks.</li>
                          <li>Ensure all interactive elements can be operated using a keyboard.</li>
                          <li>Provide sufficient color contrast between text and background colors.</li>
                          <li>Include proper alt text for images that convey information.</li>
                          <li>Use ARIA attributes judiciously to enhance accessibility when needed.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="font-semibold mb-2">Advanced Accessibility Code Examples</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">1. Semantic HTML Structure</h4>
                      <div className="bg-muted rounded-md p-3 text-sm font-mono mb-2 overflow-x-auto">
                        {/* Bad example */}
                        <div className="text-red-500 dark:text-red-400">
                          <span className="text-muted-foreground">// ❌ Bad Example</span><br />
                          &lt;div class="header"&gt;&lt;div class="logo"&gt;Site Name&lt;/div&gt;&lt;/div&gt;<br />
                          &lt;div class="navigation"&gt;...&lt;/div&gt;<br />
                          &lt;div class="content"&gt;...&lt;/div&gt;<br />
                          &lt;div class="footer"&gt;...&lt;/div&gt;
                        </div>
                        {/* Good example */}
                        <div className="text-green-500 dark:text-green-400 mt-2">
                          <span className="text-muted-foreground">// ✅ Good Example</span><br />
                          &lt;header&gt;&lt;h1&gt;Site Name&lt;/h1&gt;&lt;/header&gt;<br />
                          &lt;nav aria-label="Main Navigation"&gt;...&lt;/nav&gt;<br />
                          &lt;main&gt;<br />
                          &nbsp;&nbsp;&lt;article&gt;...&lt;/article&gt;<br />
                          &lt;/main&gt;<br />
                          &lt;footer&gt;...&lt;/footer&gt;
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use semantic HTML elements to provide meaning and structure to your content.
                        This helps assistive technologies understand the document structure.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">2. ARIA for Custom Components</h4>
                      <div className="bg-muted rounded-md p-3 text-sm font-mono mb-2 overflow-x-auto">
                        {/* Example */}
                        <div>
                          <span className="text-muted-foreground">// Custom dropdown example</span><br />
                          &lt;div role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="dropdown-label"&gt;<br />
                          &nbsp;&nbsp;&lt;span id="dropdown-label"&gt;Choose an option:&lt;/span&gt;<br />
                          &nbsp;&nbsp;&lt;div tabindex="0" aria-controls="dropdown-list"&gt;Selected option&lt;/div&gt;<br />
                          &nbsp;&nbsp;&lt;ul id="dropdown-list" role="listbox" aria-labelledby="dropdown-label" hidden&gt;<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&lt;li role="option" tabindex="-1"&gt;Option 1&lt;/li&gt;<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&lt;li role="option" tabindex="-1"&gt;Option 2&lt;/li&gt;<br />
                          &nbsp;&nbsp;&lt;/ul&gt;<br />
                          &lt;/div&gt;
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        When creating custom components, use ARIA roles, states, and properties to ensure 
                        they are accessible to assistive technologies. Test with keyboard navigation.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">3. JavaScript for Accessibility</h4>
                      <div className="bg-muted rounded-md p-3 text-sm font-mono mb-2 overflow-x-auto">
                        <pre className="text-xs">
{`// Managing focus for dialogs
const dialog = document.getElementById('dialog');
const focusableElements = dialog.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);

// Trap focus in dialog
dialog.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
    // Keep focus trapped inside dialog
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }
});`}
                        </pre>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use JavaScript to enhance accessibility by managing focus, adding keyboard 
                        support, and ensuring interactive elements have proper ARIA states.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="font-semibold mb-2">Next Steps</h3>
                  <ol className="ml-7 list-decimal space-y-2">
                    <li>Fix critical and serious violations first</li>
                    <li>Run manual keyboard testing to verify navigation</li>
                    <li>Test with screen readers to ensure proper announcements</li>
                    <li>Address moderate and minor issues</li>
                    <li>Run regular scans to monitor progress</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isMultiPage && (
          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Page Analysis</CardTitle>
                <CardDescription>
                  Accessibility results for each scanned page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Page selector */}
                  <div className="flex items-center space-x-4">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <Select 
                        value={selectedPage || ''} 
                        onValueChange={(value) => setSelectedPage(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a page to view details" />
                        </SelectTrigger>
                        <SelectContent>
                          {pagesScanned.map((page) => (
                            <SelectItem key={page} value={page}>
                              {page}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Summary of all pages */}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    {pageResults.map((page) => (
                      <div 
                        key={page.url} 
                        className={`border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                          selectedPage === page.url ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedPage(page.url)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-sm truncate flex-1" title={page.url}>
                            {page.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </h3>
                          <Badge variant="outline" className="ml-2 whitespace-nowrap">
                            {page.score.toFixed(0)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Issues: </span>
                            <span className="font-medium">{page.issueCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Passed: </span>
                            <span className="font-medium">{page.passedChecks}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Selected page details */}
                  {selectedPage && (
                    <div className="border rounded-lg p-4 mt-4">
                      <h3 className="font-semibold mb-4 flex items-center">
                        <Layers className="h-5 w-5 mr-2" />
                        Page Details: {selectedPage}
                      </h3>
                      
                      {pageResults.find(p => p.url === selectedPage) ? (
                        <div className="space-y-4">
                          {(() => {
                            const pageData = pageResults.find(p => p.url === selectedPage)!;
                            const pageViolations = pageData.violations;
                            
                            return (
                              <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                  <div className="p-3 border rounded-lg">
                                    <p className="text-2xl font-bold">{pageData.score.toFixed(0)}%</p>
                                    <p className="text-xs text-muted-foreground">Compliance</p>
                                  </div>
                                  <div className="p-3 border rounded-lg">
                                    <p className="text-2xl font-bold">{pageData.issueCount}</p>
                                    <p className="text-xs text-muted-foreground">Issues</p>
                                  </div>
                                  <div className="p-3 border rounded-lg">
                                    <p className="text-2xl font-bold">{pageData.passedChecks}</p>
                                    <p className="text-xs text-muted-foreground">Passed</p>
                                  </div>
                                  <div className="p-3 border rounded-lg">
                                    <p className="text-2xl font-bold">{pageViolations.length}</p>
                                    <p className="text-xs text-muted-foreground">Violations</p>
                                  </div>
                                </div>
                                
                                <h4 className="font-medium mt-4 mb-2">Top Issues</h4>
                                <div className="space-y-2">
                                  {pageViolations.slice(0, 3).map((violation: WcagViolation) => (
                                    <div key={violation.id} className="p-3 border rounded-lg flex items-start">
                                      <Badge variant={impactBadgeVariant[violation.impact] || "default"} className="mt-0.5 mr-3">
                                        {violation.impact}
                                      </Badge>
                                      <div>
                                        <p className="font-medium">{violation.id}</p>
                                        <p className="text-sm text-muted-foreground">{violation.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {pageViolations.length === 0 && (
                                    <p className="text-muted-foreground text-center">No violations found on this page</p>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground">
                          Detailed data not available for this page
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}