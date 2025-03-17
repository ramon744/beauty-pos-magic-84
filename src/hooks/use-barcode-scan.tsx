
import { useEffect, useRef, useState } from 'react';
import { storageService } from '@/services/storage-service';

const SCANNER_ACTIVE_KEY = 'makeup-pos-scanner-active';

type BarcodeScanCallback = (barcode: string) => void;

export function useBarcodeScan(onBarcodeDetected: BarcodeScanCallback) {
  const keyBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const isActive = useRef<boolean>(false);
  // Initialize the state from storage or default to false
  const [scannerActive, setScannerActive] = useState(() => {
    const savedState = storageService.getItem<boolean>(SCANNER_ACTIVE_KEY);
    return savedState || false;
  });

  // Clear the buffer if there's a pause in typing
  const resetBuffer = () => {
    keyBuffer.current = '';
  };

  // Handle keydown events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isActive.current) return;
    
    // Don't capture if it's inside a text input element (except for Enter key)
    if (e.key !== 'Enter' && 
        (e.target instanceof HTMLInputElement || 
         e.target instanceof HTMLTextAreaElement)) {
      return;
    }
    
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
    setScannerActive(true);
    // Save the state to storage
    storageService.setItem(SCANNER_ACTIVE_KEY, true);
  };

  const stopScanning = () => {
    isActive.current = false;
    setScannerActive(false);
    resetBuffer();
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    // Save the state to storage
    storageService.setItem(SCANNER_ACTIVE_KEY, false);
  };

  // Set up and clean up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    // If scanner should be active based on saved state, activate it
    if (scannerActive) {
      isActive.current = true;
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [onBarcodeDetected]);

  return {
    startScanning,
    stopScanning,
    isScanning: scannerActive
  };
}
