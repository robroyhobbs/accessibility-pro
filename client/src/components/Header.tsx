import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Header = () => {
  const { user, isLoading, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();

  const handleSignIn = () => {
    navigate("/auth");
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <Link href="/">
              <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent cursor-pointer">
                WCAG Compliance Analyzer
              </h1>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-primary font-medium">
              Home
            </Link>
            <a href="#features" className="text-gray-700 hover:text-primary font-medium">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-primary font-medium">
              Pricing
            </a>
            <a href="#contact" className="text-gray-700 hover:text-primary font-medium">
              Contact
            </a>
          </nav>
          
          <div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 hidden md:inline-block">
                  {user.username}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Logout"
                  )}
                </Button>
              </div>
            ) : (
              location !== "/auth" && (
                <div>
                  <Button 
                    variant="ghost" 
                    className="mr-2"
                    onClick={handleSignIn}
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={handleSignIn}
                  >
                    Sign Up
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
