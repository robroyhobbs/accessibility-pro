import { useScanContext } from "@/context/ScanContext";
import ComplianceGauge from "./ComplianceGauge";
import { AlertCircle } from "lucide-react";

type WcagViolation = {
  id: string;
  description: string;
  impact: string;
  count: number;
  wcagLevel: string;
  principle: string;
};

const ScanResults = () => {
  const { scannedUrl, results } = useScanContext();
  
  if (!results) {
    return <div>No results available</div>;
  }
  
  const { score, passedChecks, issueCount, violations } = results;
  
  return (
    <section id="scan-results" className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-dark">WCAG Compliance Results</h2>
        <p className="text-gray-600">for <span className="text-primary font-medium">{scannedUrl}</span></p>
      </div>
      
      {/* Scan Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center">
            <ComplianceGauge score={score} />
            <p className="mt-4 text-sm text-gray-600 text-center">Based on automated checks only</p>
          </div>
          
          <div className="col-span-2">
            <h3 className="text-lg font-semibold mb-4">Overview</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-500 mb-1">Detected Issues</p>
                <p className="text-2xl font-bold text-red-500">{issueCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-500 mb-1">Passed Checks</p>
                <p className="text-2xl font-bold text-green-500">{passedChecks}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
                <p className="text-sm">
                  <strong>Automated checks only:</strong> This free scan detects approximately 30-40% of potential WCAG issues. 
                  <a href="#pricing" className="text-primary hover:underline font-medium ml-1">
                    Upgrade to Premium
                  </a> for comprehensive analysis and detailed recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Major Issues */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Major Issues Detected</h3>
        
        {violations.length === 0 ? (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-green-700">
              Great job! No major accessibility issues were detected in the automated scan.
              However, manual testing is recommended for a complete assessment.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {violations.map((violation: WcagViolation) => (
              <li key={violation.id} className="border-b border-gray-200 pb-4">
                <div className="flex items-start">
                  <div className="bg-red-500 bg-opacity-10 p-2 rounded-full mr-4">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg">{violation.description}</h4>
                    <p className="text-gray-600 mb-2">
                      {violation.count} {violation.count === 1 ? 'instance was' : 'instances were'} found, {violation.impact} impact.
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                        WCAG {violation.wcagLevel}
                      </span>
                      <span className="ml-2">{violation.principle}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Upgrade Promo */}
      <div className="bg-primary bg-opacity-5 rounded-lg shadow-md p-8 border border-primary border-opacity-20 text-center">
        <h3 className="text-xl font-semibold mb-3">Get A Complete Accessibility Analysis</h3>
        <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
          This free scan only covers the basics. Upgrade to get detailed fixes, multi-page scanning, and a comprehensive report with actionable recommendations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h4 className="font-medium mb-1">Detailed Report</h4>
            <p className="text-sm text-gray-600">Get specific code fixes and recommendations for all issues</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <h4 className="font-medium mb-1">Multi-Page Scanning</h4>
            <p className="text-sm text-gray-600">Scan up to 100 pages for a comprehensive site analysis</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-medium mb-1">Compliance Badge</h4>
            <p className="text-sm text-gray-600">Showcase your commitment to accessibility with a verified badge</p>
          </div>
        </div>
        
        <a href="#pricing" className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-3 px-8 rounded-lg transition duration-150 ease-in-out">
          Upgrade to Premium
        </a>
      </div>
    </section>
  );
};

export default ScanResults;
