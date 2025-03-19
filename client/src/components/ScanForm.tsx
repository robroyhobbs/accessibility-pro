import { useState } from "react";
import { isValidUrl } from "@/lib/validators";
import { useScanContext } from "@/context/ScanContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ScanForm = () => {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState(false);
  const { setScanState, setScannedUrl, setResults } = useScanContext();
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/scan", { url });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      setScanState("results");
    },
    onError: (error) => {
      setScanState("idle");
      toast({
        title: "Scan failed",
        description: error.message || "Failed to scan the website. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setValidationError(true);
      return;
    }
    
    if (!isValidUrl(url)) {
      setValidationError(true);
      return;
    }
    
    setValidationError(false);
    setScannedUrl(url);
    setScanState("scanning");
    
    // Start the scan
    scanMutation.mutate(url);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (e.target.value && !isValidUrl(e.target.value)) {
      setValidationError(true);
    } else {
      setValidationError(false);
    }
  };

  return (
    <form id="scan-form" className="mb-8 max-w-2xl mx-auto" onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="url"
            id="website-url"
            name="website-url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            className={`w-full px-4 py-3 rounded-lg border ${
              validationError ? "border-red-500" : "border-gray-300"
            } focus:border-primary focus:ring-2 focus:ring-primary-light focus:ring-opacity-50`}
            aria-label="Website URL"
            required
          />
          {validationError && (
            <div className="absolute left-0 -bottom-6 text-sm text-red-500">
              Please enter a valid URL (e.g., https://example.com)
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-8 rounded-lg transition duration-150 ease-in-out"
          disabled={scanMutation.isPending}
        >
          {scanMutation.isPending ? "Scanning..." : "Scan Now"}
        </button>
      </div>
    </form>
  );
};

export default ScanForm;
