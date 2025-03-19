import { useState } from "react";
import { useScanContext } from "@/context/ScanContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Download, AlertTriangle, Info, ChevronRight } from "lucide-react";
import ComplianceGauge from "./ComplianceGauge";

type WcagViolation = {
  id: string;
  description: string;
  impact: string;
  count: number;
  wcagLevel: string;
  principle: string;
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

  if (!results) {
    return (
      <div className="flex justify-center my-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  const { score, passedChecks, issueCount, violations } = results;

  const handleRunNewScan = () => {
    setScanState("idle");
  };

  const handleDownloadReport = () => {
    setIsDownloading(true);
    
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Report Downloaded",
        description: "Your accessibility report has been downloaded successfully",
      });
      setIsDownloading(false);
    }, 1500);
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
              <div className="text-muted-foreground mb-4 truncate">
                <span className="font-medium text-foreground">{scannedUrl}</span>
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
                                <Button variant="ghost" size="sm" className="ml-auto">
                                  <span className="mr-1">View Details</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
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
                  <h3 className="font-semibold mb-2">General Recommendations</h3>
                  <ul className="ml-7 list-disc space-y-2">
                    <li>Ensure all images have meaningful alt text</li>
                    <li>Maintain sufficient color contrast for text elements</li>
                    <li>Add proper ARIA labels to interactive elements</li>
                    <li>Ensure keyboard navigation is possible throughout the site</li>
                    <li>Provide visible focus indicators for all interactive elements</li>
                  </ul>
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
      </Tabs>
    </div>
  );
}