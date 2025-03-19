import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function SubscriptionSuccessPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Subscription Activated!
          </h1>
          <p className="text-muted-foreground mb-4">
            Thank you for subscribing to our Pro plan. You now have access to all premium features
            including multi-page scanning and detailed recommendations.
          </p>
        </CardContent>
        <CardFooter className="flex gap-4 justify-center">
          <Button onClick={() => setLocation("/")}>
            Start Scanning
          </Button>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}