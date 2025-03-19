import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function SubscriptionCancelPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Subscription Cancelled
          </h1>
          <p className="text-muted-foreground mb-4">
            You've cancelled the subscription process. You can still use our free features
            or subscribe to Pro plan whenever you're ready.
          </p>
        </CardContent>
        <CardFooter className="flex gap-4 justify-center">
          <Button onClick={() => setLocation("/pricing")}>
            View Plans
          </Button>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}