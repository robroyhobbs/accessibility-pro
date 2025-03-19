import { useState, useEffect } from "react";
import { useScanContext } from "@/context/ScanContext";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type ScanStep = {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "error";
};

export default function ScanProgress() {
  const { scannedUrl } = useScanContext();
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Simulate scanning steps
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([
    { id: "initialize", name: "Initializing scanner", status: "in-progress" },
    { id: "fetch", name: "Fetching website content", status: "pending" },
    { id: "parse", name: "Parsing DOM structure", status: "pending" },
    { id: "analyze", name: "Analyzing accessibility issues", status: "pending" },
    { id: "generate", name: "Generating report", status: "pending" },
  ]);

  // Simulate scanning progress
  useEffect(() => {
    const totalSteps = scanSteps.length;
    let step = 0;
    
    const timer = setInterval(() => {
      if (step < totalSteps) {
        // Update current step status
        setScanSteps(prev => {
          const updated = [...prev];
          if (step > 0) {
            updated[step - 1] = { ...updated[step - 1], status: "completed" };
          }
          updated[step] = { ...updated[step], status: "in-progress" };
          return updated;
        });
        
        setCurrentStepIndex(step);
        setProgress(Math.floor((step + 0.5) * (100 / totalSteps)));
        
        step++;
      } else {
        // Complete the last step
        setScanSteps(prev => {
          const updated = [...prev];
          updated[totalSteps - 1] = { ...updated[totalSteps - 1], status: "completed" };
          return updated;
        });
        
        setProgress(100);
        clearInterval(timer);
      }
    }, 800); // Each step takes about 800ms for a realistic feel
    
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Scanning in Progress</h2>
            <p className="text-muted-foreground">
              Analyzing <span className="font-medium text-foreground">{scannedUrl}</span> for WCAG compliance issues
            </p>
          </div>
          
          <Progress value={progress} className="h-2 mb-8" />
          
          <div className="space-y-4">
            {scanSteps.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                  step.status === "in-progress" 
                    ? "bg-primary/5 border border-primary/20" 
                    : step.status === "completed"
                    ? "opacity-70"
                    : ""
                }`}
              >
                <div className="flex-shrink-0">
                  {step.status === "pending" && (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  {step.status === "in-progress" && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {step.status === "completed" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {step.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-grow">
                  <p className={`font-medium ${
                    step.status === "in-progress" ? "text-primary" : ""
                  }`}>
                    {step.name}
                  </p>
                </div>
                <div className="flex-shrink-0 text-sm text-muted-foreground">
                  {index < currentStepIndex 
                    ? "Complete" 
                    : index === currentStepIndex 
                    ? "In progress" 
                    : "Pending"}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            This may take a minute or two depending on the complexity of the website
          </p>
        </div>
      </CardContent>
    </Card>
  );
}