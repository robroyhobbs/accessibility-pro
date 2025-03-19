import { Link } from "wouter";

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h1 className="ml-2 text-xl font-bold text-primary">AccessCheck</h1>
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
            <button className="text-primary font-medium mr-4">Sign In</button>
            <button className="bg-primary text-white px-4 py-2 rounded-md font-medium">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
