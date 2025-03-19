import { useScanContext } from "@/context/ScanContext";
import { useEffect, useState } from "react";

type ScanStep = {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed";
};

const initialSteps: ScanStep[] = [
  { id: "loading", name: "Page Loading", status: "in-progress" },
  { id: "structure", name: "Structure Analysis", status: "pending" },
  { id: "wcag", name: "WCAG Evaluation", status: "pending" },
  { id: "report", name: "Report Generation", status: "pending" },
];

const ScanProgress = () => {
  const { scannedUrl } = useScanContext();
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Loading website...");
  const [steps, setSteps] = useState<ScanStep[]>(initialSteps);

  // Simulate progress for demo purposes
  useEffect(() => {
    let totalSteps = steps.length;
    let currentStepIndex = 0;
    let currentStep = steps[currentStepIndex];
    
    const messages = [
      "Loading website...",
      "Analyzing page structure and content...",
      "Evaluating WCAG compliance...",
      "Generating report...",
      "Finalizing results..."
    ];

    const interval = setInterval(() => {
      if (progress >= 100) {
        clearInterval(interval);
        return;
      }

      // Calculate which step we should be on based on progress
      const newStepIndex = Math.min(Math.floor((progress / 100) * totalSteps), totalSteps - 1);
      
      if (newStepIndex > currentStepIndex) {
        // Update previous step to completed
        setSteps(prevSteps => 
          prevSteps.map((step, idx) => 
            idx === currentStepIndex 
              ? { ...step, status: "completed" } 
              : step
          )
        );
        
        // Set new step to in-progress
        setSteps(prevSteps => 
          prevSteps.map((step, idx) => 
            idx === newStepIndex 
              ? { ...step, status: "in-progress" } 
              : step
          )
        );
        
        currentStepIndex = newStepIndex;
        currentStep = steps[currentStepIndex];
        setStatusMessage(messages[Math.min(newStepIndex, messages.length - 1)]);
      }

      setProgress(prev => Math.min(prev + 2, 100));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="scan-in-progress" className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-dark">Scanning Your Website</h2>
        <p className="text-gray-600">
          We're checking <span className="text-primary font-medium">{scannedUrl}</span> for WCAG compliance issues
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-gray-600 mb-8">{statusMessage}</p>
          
          <div className="grid grid-cols-2 gap-8 w-full max-w-md">
            {steps.map((step) => (
              <div className="flex items-center" key={step.id}>
                {step.status === "completed" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {step.status === "in-progress" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary animate-spin mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {step.status === "pending" && (
                  <div className="h-5 w-5 bg-gray-200 rounded-full mr-2"></div>
                )}
                <span className={`text-sm ${step.status === "pending" ? "text-gray-400" : "text-gray-600"}`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mt-8">This process typically takes 10-15 seconds for a single page.</p>
        </div>
      </div>
    </section>
  );
};

export default ScanProgress;
