
import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const SyncStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "Conexão perdida",
        description: "Você está offline. O aplicativo precisa de conexão com a internet para funcionar."
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center">
      {isOnline ? (
        <div className="flex items-center text-green-600" title="Online">
          <Wifi className="h-4 w-4 mr-1" />
          <span className="text-xs mr-2">Online</span>
        </div>
      ) : (
        <div className="flex items-center text-red-600" title="Offline - Aplicativo indisponível">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-xs mr-2">Offline - Aplicativo indisponível</span>
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
