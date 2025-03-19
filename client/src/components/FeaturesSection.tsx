import React from "react";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-dark mb-4">Comprehensive Accessibility Analysis</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our WCAG compliance analyzer provides detailed insights to help make your website accessible to everyone
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="bg-primary bg-opacity-10 rounded-full p-3 h-14 w-14 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-dark mb-2">Automated WCAG Scanning</h3>
              <p className="text-gray-600">
                Our tool uses Axe-core with Puppeteer to scan rendered pages, capturing dynamic content and evaluating key WCAG criteria including text alternatives, color contrast, keyboard accessibility, and more.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="bg-primary bg-opacity-10 rounded-full p-3 h-14 w-14 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-dark mb-2">Detailed Compliance Scoring</h3>
              <p className="text-gray-600">
                Get a clear percentage score based on the ratio of passed checks to total applicable checks, with color-coded gauges and weighted scoring in paid versions to highlight the severity of issues.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="bg-primary bg-opacity-10 rounded-full p-3 h-14 w-14 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-dark mb-2">Actionable Recommendations</h3>
              <p className="text-gray-600">
                Premium reports provide specific fixes with code examples, prioritized by impact level, helping your development team implement changes efficiently and effectively.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="bg-primary bg-opacity-10 rounded-full p-3 h-14 w-14 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-dark mb-2">Flexible Subscription Options</h3>
              <p className="text-gray-600">
                Choose from our free tier for basic checks, one-time Basic payment for detailed 10-page analysis, or Premium subscription for comprehensive 100-page scanning, API access, and compliance badges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
