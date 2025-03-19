import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubscribe = async () => {
    if (!user) {
      setLocation("/auth");
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/create-checkout-session");
      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get comprehensive accessibility insights with our premium features.
          Upgrade to scan multiple pages and access detailed recommendations.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <p className="text-3xl font-bold">$0</p>
            <p className="text-sm text-muted-foreground">Perfect for getting started</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Single page scans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Basic accessibility checks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>3 scans per day</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={() => setLocation("/")}>
              Get Started
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <p className="text-3xl font-bold">$19.99</p>
            <p className="text-sm text-muted-foreground">per month</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Multi-page scanning (up to 10 pages)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Advanced accessibility insights</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Unlimited scans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Detailed recommendations</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleSubscribe}>
              {user?.subscriptionStatus === "active" 
                ? "Manage Subscription" 
                : "Subscribe Now"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}