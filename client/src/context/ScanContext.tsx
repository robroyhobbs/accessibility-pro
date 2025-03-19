import { createContext, useContext, useState, ReactNode } from 'react';

// Define the types
export type ScanState = 'idle' | 'scanning' | 'results';

export type ScanResult = {
  score: number;
  passedChecks: number;
  issueCount: number;
  violations: any[];
};

// Create the context interface
interface ScanContextProps {
  scanState: ScanState;
  setScanState: (state: ScanState) => void;
  scannedUrl: string;
  setScannedUrl: (url: string) => void;
  results: ScanResult | null;
  setResults: (results: ScanResult | null) => void;
}

// Create the context with default values
const ScanContext = createContext<ScanContextProps>({
  scanState: 'idle',
  setScanState: () => {},
  scannedUrl: '',
  setScannedUrl: () => {},
  results: null,
  setResults: () => {},
});

// Provider component
export const ScanProvider = ({ children }: { children: ReactNode }) => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scannedUrl, setScannedUrl] = useState<string>('');
  const [results, setResults] = useState<ScanResult | null>(null);

  const value = {
    scanState,
    setScanState,
    scannedUrl,
    setScannedUrl,
    results,
    setResults,
  };

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  );
};

// Custom hook to use the context
export const useScanContext = () => {
  const context = useContext(ScanContext);
  return context;
};
