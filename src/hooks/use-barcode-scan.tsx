
import { useEffect, useRef } from 'react';

type BarcodeScanCallback = (barcode: string) => void;

export function useBarcodeScan(onBarcodeDetected: BarcodeScanCallback) {
  const keyBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const isActive = useRef<boolean>(false);

  // Clear the buffer if there's a pause in typing
  const resetBuffer = () => {
    keyBuffer.current = '';
  };

  // Handle keydown events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isActive.current) return;
    
    const currentTime = new Date().getTime();
    
    // If it's been more than 100ms since the last keypress, clear the buffer
    if (currentTime - lastKeyTime.current > 100) {
      resetBuffer();
    }
    
    // Only collect numbers, letters, and some special characters
    if (/^[a-zA-Z0-9-_]$/.test(e.key)) {
      keyBuffer.current += e.key;
      lastKeyTime.current = currentTime;
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      
      // Set a timeout to process the barcode
      timeoutRef.current = window.setTimeout(() => {
        // Only process if we have a reasonable barcode length (usually 8+ chars)
        if (keyBuffer.current.length >= 4) {
          onBarcodeDetected(keyBuffer.current);
        }
        resetBuffer();
      }, 100);
    }
    
    // If Enter key is pressed and we have content in buffer, process it immediately
    if (e.key === 'Enter' && keyBuffer.current.length > 0) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      onBarcodeDetected(keyBuffer.current);
      resetBuffer();
      e.preventDefault(); // Prevent form submission if in a form
    }
  };

  const startScanning = () => {
    isActive.current = true;
  };

  const stopScanning = () => {
    isActive.current = false;
    resetBuffer();
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  };

  // Set up and clean up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [onBarcodeDetected]);

  return {
    startScanning,
    stopScanning
  };
}
