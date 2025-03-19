import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Scan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useScanContext } from "@/context/ScanContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import ComplianceGauge from "@/components/ComplianceGauge";
import { AlertCircle, ArrowLeft, Calendar, Clock, Download, Eye, FileDown, Globe, Home, Share2 } from "lucide-react";
import { format } from "date-fns";

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { setResults, setScanState, setScannedUrl } = useScanContext();
  const [, navigate] = useLocation();

  // Fetch scan data
  const { data: scan, isLoading, error } = useQuery<Scan>({
    queryKey: ["/api/scans", id],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Parse violations from scan data
  const [violations, setViolations] = useState<any[]>([]);
  
  useEffect(() => {
    if (scan?.violations) {
      try {
        if (typeof scan.violations === 'string') {
          setViolations(JSON.parse(scan.violations));
        } else if (Array.isArray(scan.violations)) {
          setViolations(scan.violations);
        }
      } catch (e) {
        console.error("Error parsing violations:", e);
        setViolations([]);
      }
    }
  }, [scan]);

  // Calculate statistics
  const impactCounts = violations.reduce((acc: Record<string, number>, v: any) => {
    acc[v.impact] = (acc[v.impact] || 0) + 1;
    return acc;
  }, {});

  const totalIssues = scan?.issueCount || 0;
  const criticalIssues = impactCounts['critical'] || 0;
  const seriousIssues = impactCounts['serious'] || 0;
  const moderateIssues = impactCounts['moderate'] || 0;
  const minorIssues = impactCounts['minor'] || 0;

  // Group violations by impact level
  const criticalViolations = violations.filter(v => v.impact === 'critical');
  const seriousViolations = violations.filter(v => v.impact === 'serious');
  const moderateViolations = violations.filter(v => v.impact === 'moderate');
  const minorViolations = violations.filter(v => v.impact === 'minor');

  // View in scanner
  const viewInScanner = () => {
    if (scan) {
      setScannedUrl(scan.url);
      setResults({
        score: scan.score,
        passedChecks: scan.passedChecks,
        issueCount: scan.issueCount,
        violations: violations
      });
      setScanState('results');
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-muted rounded-md mb-4"></div>
          <div className="h-64 w-full max-w-3xl bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="text-center py-12 border rounded-lg bg-destructive/10">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
          <h2 className="text-2xl font-bold mb-2">Scan Not Found</h2>
          <p className="text-muted-foreground mb-6">The scan you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/">
              <BreadcrumbLink>Home</BreadcrumbLink>
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href="/dashboard">
              <BreadcrumbLink>Dashboard</BreadcrumbLink>
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Scan Details</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Scan Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 truncate max-w-2xl">{scan.url}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(scan.createdAt), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(scan.createdAt), "h:mm a")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                <span>{new URL(scan.url).hostname}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={viewInScanner}>
              <Eye className="mr-2 h-4 w-4" />
              View in Scanner
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 md:col-span-1">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Compliance Score</CardTitle>
            <CardDescription>Overall WCAG compliance rating</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center">
            <ComplianceGauge score={scan.score} />
            <div className="mt-4 text-center">
              <div className="text-4xl font-bold">{scan.score.toFixed(1)}</div>
              <p className="text-muted-foreground">out of 100</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Issue Breakdown</CardTitle>
            <CardDescription>Categorized by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-red-800">Critical</h3>
                  <p className="text-2xl font-bold text-red-700">{criticalIssues}</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-orange-800">Serious</h3>
                  <p className="text-2xl font-bold text-orange-700">{seriousIssues}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-amber-800">Moderate</h3>
                  <p className="text-2xl font-bold text-amber-700">{moderateViolations.length}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-blue-800">Minor</h3>
                  <p className="text-2xl font-bold text-blue-700">{minorIssues}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">Total Issues:</span>
                  <span className="font-medium ml-1">{totalIssues}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Passed Checks:</span>
                  <span className="font-medium ml-1">{scan.passedChecks}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="summary" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="issues">Violations</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          {scan.isPaid && <TabsTrigger value="code">Code Fixes</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Critical Issues</CardTitle>
              <CardDescription>Must be fixed - severe accessibility barriers</CardDescription>
            </CardHeader>
            <CardContent>
              {criticalViolations.length > 0 ? (
                <div className="space-y-4">
                  {criticalViolations.map((violation, index) => (
                    <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <h3 className="font-medium text-red-800">{violation.id}</h3>
                      <p className="text-red-700 mt-1">{violation.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                          {violation.wcagLevel}
                        </span>
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                          {violation.principle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No critical issues detected. Great job!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serious Issues</CardTitle>
              <CardDescription>Should be fixed - significant accessibility barriers</CardDescription>
            </CardHeader>
            <CardContent>
              {seriousViolations.length > 0 ? (
                <div className="space-y-4">
                  {seriousViolations.map((violation, index) => (
                    <div key={index} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <h3 className="font-medium text-orange-800">{violation.id}</h3>
                      <p className="text-orange-700 mt-1">{violation.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                          {violation.wcagLevel}
                        </span>
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                          {violation.principle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No serious issues detected. Great job!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderate & Minor Issues</CardTitle>
              <CardDescription>Recommended to fix - potential accessibility barriers</CardDescription>
            </CardHeader>
            <CardContent>
              {moderateViolations.length > 0 || minorViolations.length > 0 ? (
                <div className="space-y-4">
                  {[...moderateViolations, ...minorViolations].map((violation, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${
                      violation.impact === 'moderate' 
                        ? 'border-amber-200 bg-amber-50' 
                        : 'border-blue-200 bg-blue-50'
                    }`}>
                      <h3 className={`font-medium ${
                        violation.impact === 'moderate' 
                          ? 'text-amber-800' 
                          : 'text-blue-800'
                      }`}>{violation.id}</h3>
                      <p className={
                        violation.impact === 'moderate' 
                          ? 'text-amber-700' 
                          : 'text-blue-700'
                      }>{violation.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          violation.impact === 'moderate' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {violation.wcagLevel}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          violation.impact === 'moderate' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {violation.principle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No moderate or minor issues detected. Great job!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Suggested improvements to increase accessibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {criticalViolations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">High Priority</h3>
                    <div className="space-y-4">
                      {criticalViolations.map((violation, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-medium">{violation.id}</h4>
                          <p className="text-muted-foreground mt-1">{violation.description}</p>
                          <div className="mt-3">
                            <h5 className="font-medium mb-1">Recommended Fix:</h5>
                            <p>Ensure all {violation.id.toLowerCase()} elements follow WCAG guidelines for {violation.principle}.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seriousViolations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Medium Priority</h3>
                    <div className="space-y-4">
                      {seriousViolations.map((violation, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-medium">{violation.id}</h4>
                          <p className="text-muted-foreground mt-1">{violation.description}</p>
                          <div className="mt-3">
                            <h5 className="font-medium mb-1">Recommended Fix:</h5>
                            <p>Address {violation.id.toLowerCase()} to improve accessibility related to {violation.principle}.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {violations.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-green-600 font-medium mb-2">Excellent work!</p>
                    <p className="text-muted-foreground">Your website already follows best practices for accessibility.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Summary</CardTitle>
              <CardDescription>Overall WCAG compliance assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p>
                    This website achieved a compliance score of <strong>{scan.score.toFixed(1)}</strong> out of 100.
                    {scan.score >= 90 
                      ? ' This is an excellent score indicating strong accessibility compliance.'
                      : scan.score >= 70
                        ? ' This is a good score, but there are still important issues to address.'
                        : ' This score indicates significant accessibility barriers that need immediate attention.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Breakdown by WCAG Principles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Perceivable</h4>
                      <p className="text-sm text-muted-foreground mt-1">Information must be presentable to users in ways they can perceive.</p>
                      <div className="mt-2">
                        <p>Issues: {violations.filter(v => v.principle === 'Perceivable').length}</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Operable</h4>
                      <p className="text-sm text-muted-foreground mt-1">User interface components must be operable by all users.</p>
                      <div className="mt-2">
                        <p>Issues: {violations.filter(v => v.principle === 'Operable').length}</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Understandable</h4>
                      <p className="text-sm text-muted-foreground mt-1">Information and operation must be understandable.</p>
                      <div className="mt-2">
                        <p>Issues: {violations.filter(v => v.principle === 'Understandable').length}</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Robust</h4>
                      <p className="text-sm text-muted-foreground mt-1">Content must be robust enough to work with various technologies.</p>
                      <div className="mt-2">
                        <p>Issues: {violations.filter(v => v.principle === 'Robust').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Compliance Level</h3>
                  <div className="p-4 border rounded-lg">
                    <p>
                      Based on the scan results, this website
                      {violations.some(v => v.wcagLevel === 'A' && ['critical', 'serious'].includes(v.impact))
                        ? ' does not meet WCAG 2.1 Level A compliance.'
                        : violations.some(v => v.wcagLevel === 'AA' && ['critical', 'serious'].includes(v.impact))
                          ? ' meets WCAG 2.1 Level A compliance but not Level AA.'
                          : violations.some(v => v.wcagLevel === 'AAA' && ['critical', 'serious'].includes(v.impact))
                            ? ' meets WCAG 2.1 Level AA compliance but not Level AAA.'
                            : ' appears to meet WCAG 2.1 Level AAA compliance. Congratulations!'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {scan.isPaid && (
          <TabsContent value="code">
            <Card>
              <CardHeader>
                <CardTitle>Code Remediation</CardTitle>
                <CardDescription>Code examples to fix accessibility issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/5 p-4 rounded-lg mb-6">
                  <h3 className="font-medium mb-2">Premium Feature</h3>
                  <p>This section provides code examples to fix the accessibility issues found on your website.</p>
                </div>
                
                {criticalViolations.length > 0 && (
                  <div className="space-y-6">
                    {criticalViolations.map((violation, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <h3 className="font-medium">{violation.id}</h3>
                        <p className="text-muted-foreground mt-1 mb-3">{violation.description}</p>
                        
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="mb-2">
                            <h4 className="text-sm font-medium">Problematic Code:</h4>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm mt-1 overflow-x-auto">
                              {`<!-- Example of problematic code for ${violation.id} -->`}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Suggested Fix:</h4>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm mt-1 overflow-x-auto">
                              {`<!-- Fixed code example for ${violation.id} -->`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {criticalViolations.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-green-600 font-medium mb-2">No critical issues to fix!</p>
                    <p className="text-muted-foreground">Your website doesn't have critical accessibility issues that require code examples.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Back Button */}
      <div className="mt-8">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}