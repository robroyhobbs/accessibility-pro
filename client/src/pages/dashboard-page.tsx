import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Scan } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, Clock, Calendar, ExternalLink, Users, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Get user's scans
  const { data: userScans, isLoading: isLoadingScans } = useQuery<Scan[]>({
    queryKey: ["/api/user/scans"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Statistics calculation
  const stats = {
    totalScans: userScans?.length || 0,
    avgScore: userScans?.length ? 
      userScans.reduce((sum, scan) => sum + scan.score, 0) / userScans.length : 0,
    criticalIssues: userScans?.reduce((sum, scan) => sum + (scan.violations ? 
      (typeof scan.violations === 'string' ? 
        JSON.parse(scan.violations as string).filter((v: any) => v.impact === 'critical').length : 
        Array.isArray(scan.violations) ? 
          scan.violations.filter((v: any) => v.impact === 'critical').length : 0) : 0), 0) || 0,
    latestScan: userScans?.[0]?.createdAt ? 
      formatDistanceToNow(new Date(userScans[0].createdAt), { addSuffix: true }) : 'Never',
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.username}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">Websites analyzed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Out of 100 points</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">Across all scans</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.latestScan}</div>
            <p className="text-xs text-muted-foreground">Last website scan</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Scans</h2>
        {isLoadingScans ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : userScans && userScans.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userScans.slice(0, 6).map((scan) => (
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
                  <Link href={`/scans/${scan.id}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground mb-2">You haven't run any scans yet</p>
            <p>Start by scanning a website from the home page</p>
            <Link href="/">
              <Button className="mt-4">
                Go to Scanner
              </Button>
            </Link>
          </div>
        )}
        
        {userScans && userScans.length > 6 && (
          <div className="flex justify-center mt-6">
            <Button variant="outline">View All Scans</Button>
          </div>
        )}
      </div>

      {/* Premium Features Highlight */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Premium Features Available</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start">
            <div className="mr-2 h-6 w-6 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">Multi-page Scanning</h3>
              <p className="text-sm text-muted-foreground">
                Scan multiple pages of your site in one go
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="mr-2 h-6 w-6 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">PDF Reports</h3>
              <p className="text-sm text-muted-foreground">
                Export detailed reports in PDF format
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="mr-2 h-6 w-6 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">Code Remediation</h3>
              <p className="text-sm text-muted-foreground">
                Get code examples to fix issues
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Timeline */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Activity Timeline</h2>
        {isLoadingScans ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : userScans && userScans.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Website</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Issues</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userScans.slice(0, 10).map((scan) => (
                    <tr key={scan.id} className="border-b">
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(scan.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">
                        {scan.url}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${
                          scan.score >= 90 ? 'text-green-600' : 
                          scan.score >= 70 ? 'text-amber-600' : 
                          'text-red-600'
                        }`}>
                          {scan.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {scan.issueCount}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/scans/${scan.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No activity to display</p>
          </div>
        )}
      </div>
    </div>
  );
}