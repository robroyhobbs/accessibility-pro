import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { Scan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

export default function ScanHistory() {
  const [activeTab, setActiveTab] = useState<string>("your-scans");
  const { user } = useAuth();
  
  // Get user's scans if authenticated
  const { data: userScans, isLoading: isLoadingScans } = useQuery<Scan[]>({
    queryKey: ["/api/user/scans"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Get recent public scans
  const { data: recentScans, isLoading: isLoadingRecent } = useQuery<Scan[]>({
    queryKey: ["/api/scans/recent"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const handleViewDetails = (scanId: number) => {
    // Future implementation: navigate to scan details page
    console.log(`Viewing details for scan ${scanId}`);
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== "/" ? urlObj.pathname : "");
    } catch (e) {
      return url;
    }
  };

  const getScanScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6">Scan History</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          {user && <TabsTrigger value="your-scans">Your Scans</TabsTrigger>}
          <TabsTrigger value="recent-scans">Recent Public Scans</TabsTrigger>
        </TabsList>
        
        {user && (
          <TabsContent value="your-scans">
            {isLoadingScans ? (
              <div className="flex justify-center my-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : userScans && userScans.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userScans.map((scan) => (
                  <Card key={scan.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="truncate text-lg flex items-center gap-2">
                        {formatUrl(scan.url)}
                        <a href={scan.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </CardTitle>
                      <CardDescription>
                        {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                        {scan.isPaid && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                            Premium
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className={`text-3xl font-bold ${getScanScoreColor(scan.score)}`}>
                            {scan.score.toFixed(0)}
                          </span>
                          <span className="text-muted-foreground">/100</span>
                        </div>
                        <div className="text-right">
                          <p>Issues: <span className="font-medium">{scan.issueCount}</span></p>
                          <p>Passed: <span className="font-medium">{scan.passedChecks}</span></p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleViewDetails(scan.id)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-2">You haven't run any scans yet</p>
                <p>Start by scanning a website using the form above</p>
              </div>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="recent-scans">
          {isLoadingRecent ? (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
            </div>
          ) : recentScans && recentScans.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentScans.map((scan) => (
                <Card key={scan.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="truncate text-lg flex items-center gap-2">
                      {formatUrl(scan.url)}
                      <a href={scan.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className={`text-3xl font-bold ${getScanScoreColor(scan.score)}`}>
                          {scan.score.toFixed(0)}
                        </span>
                        <span className="text-muted-foreground">/100</span>
                      </div>
                      <div className="text-right">
                        <p>Issues: <span className="font-medium">{scan.issueCount}</span></p>
                        <p>Passed: <span className="font-medium">{scan.passedChecks}</span></p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleViewDetails(scan.id)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No public scans available yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}