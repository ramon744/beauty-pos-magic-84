
import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Database } from 'lucide-react';
import { storageService } from '@/services/storage-service';
import { Button } from '../ui/button';
import { toast } from '../ui/use-toast';

export const SyncStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check pending operations count periodically
  useEffect(() => {
    const checkPendingOperations = () => {
      const count = storageService.getPendingOperationsCount();
      setPendingOperations(count);
    };
    
    // Check immediately
    checkPendingOperations();
    
    // Then check every 5 seconds
    const interval = setInterval(checkPendingOperations, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Force sync manually
  const handleForceSync = async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de sincronização",
        description: "Você está offline. Conecte-se à internet para sincronizar."
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const result = await storageService.syncPendingOperations();
      setPendingOperations(result.pendingCount);
      
      if (result.success) {
        toast({
          title: "Sincronização concluída",
          description: result.pendingCount > 0 
            ? `Sincronização parcial. ${result.pendingCount} operações pendentes.` 
            : "Todos os dados foram sincronizados com sucesso."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro de sincronização",
          description: "Não foi possível sincronizar todos os dados. Tente novamente mais tarde."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro de sincronização",
        description: "Ocorreu um erro durante a sincronização."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center">
      {isOnline ? (
        <div className="flex items-center text-green-600" title="Online">
          <Wifi className="h-4 w-4 mr-1" />
          <span className="text-xs mr-2">Online</span>
        </div>
      ) : (
        <div className="flex items-center text-amber-600" title="Offline - Usando armazenamento local">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-xs mr-2">Offline</span>
        </div>
      )}
      
      {pendingOperations > 0 && (
        <div className="flex items-center ml-2">
          <Database className="h-4 w-4 mr-1 text-blue-600" />
          <span className="text-xs mr-2">{pendingOperations} pendente(s)</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={handleForceSync}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
