import { useScanContext } from "@/context/ScanContext";
import ScanForm from "@/components/ScanForm";
import ScanProgress from "@/components/ScanProgress";
import ScanResults from "@/components/ScanResults";
import PricingSection from "@/components/PricingSection";
import FeaturesSection from "@/components/FeaturesSection";

const Home = () => {
  const { scanState } = useScanContext();

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="bg-blue-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-neutral-dark mb-6">
            Check Your Website's WCAG Compliance
          </h2>
          <p className="text-lg mb-8 text-gray-600">
            Scan your website for accessibility issues and get actionable insights to improve compliance with WCAG standards.
          </p>
          
          <ScanForm />
          
          <div className="text-sm text-gray-600 max-w-2xl mx-auto">
            <p className="mb-2">
              Free scan checks a single page for basic accessibility issues.{" "}
              <a href="#pricing" className="text-primary hover:underline">
                Upgrade
              </a>{" "}
              for full site scanning and detailed reports.
            </p>
            <p>
              By using our service, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Scan Progress Section - only show when scanning */}
      {scanState === "scanning" && <ScanProgress />}

      {/* Scan Results Section - only show when results are available */}
      {scanState === "results" && <ScanResults />}

      {/* Features Section */}
      <FeaturesSection />

      {/* Pricing Section */}
      <PricingSection />
    </main>
  );
};

export default Home;
