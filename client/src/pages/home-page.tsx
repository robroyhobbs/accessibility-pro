import { useAuth } from "@/hooks/use-auth";
import { useScanContext } from "@/context/ScanContext";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Scan } from "@shared/schema";
import ScanForm from "@/components/ScanForm";
import ScanProgress from "@/components/ScanProgress";
import ScanResults from "@/components/ScanResults";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { scanState } = useScanContext();
  
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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            WCAG Compliance Analyzer
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Analyze your website for accessibility compliance with WCAG standards
          </p>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        )}
      </header>

      <div className="mb-10">
        {scanState === 'idle' && <ScanForm />}
        {scanState === 'scanning' && <ScanProgress />}
        {scanState === 'results' && <ScanResults />}
      </div>

      {/* Scan History Section */}
      <div className="mt-12">
        <Tabs defaultValue={user ? "your-scans" : "recent-scans"} className="mt-8">
          <TabsList className="mb-6">
            {user && <TabsTrigger value="your-scans">Your Scans</TabsTrigger>}
            <TabsTrigger value="recent-scans">Recent Public Scans</TabsTrigger>
          </TabsList>
          
          {user && (
            <TabsContent value="your-scans">
              <h2 className="text-2xl font-bold mb-4">Your Scan History</h2>
              {isLoadingScans ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                </div>
              ) : userScans && userScans.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {userScans.map((scan) => (
                    <Card key={scan.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="truncate text-lg">{scan.url}</CardTitle>
                        <CardDescription>
                          {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-3xl font-bold">{scan.score.toFixed(0)}</span>
                            <span className="text-muted-foreground">/100</span>
                          </div>
                          <div className="text-right">
                            <p>Issues: <span className="font-medium">{scan.issueCount}</span></p>
                            <p>Passed: <span className="font-medium">{scan.passedChecks}</span></p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full" size="sm">
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
            <h2 className="text-2xl font-bold mb-4">Recent Public Scans</h2>
            {isLoadingRecent ? (
              <div className="flex justify-center my-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : recentScans && recentScans.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recentScans.map((scan) => (
                  <Card key={scan.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="truncate text-lg">{scan.url}</CardTitle>
                      <CardDescription>
                        {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-3xl font-bold">{scan.score.toFixed(0)}</span>
                          <span className="text-muted-foreground">/100</span>
                        </div>
                        <div className="text-right">
                          <p>Issues: <span className="font-medium">{scan.issueCount}</span></p>
                          <p>Passed: <span className="font-medium">{scan.passedChecks}</span></p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" size="sm">
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
    </div>
  );
}