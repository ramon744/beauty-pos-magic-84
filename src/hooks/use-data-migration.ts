
import { useState, useEffect } from 'react';
import { migrationService } from '@/services/migration-service';

export function useDataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const runMigration = async () => {
    try {
      setIsMigrating(true);
      setError(null);
      
      const result = await migrationService.migrateAll();
      setIsCompleted(true);
      
      return result;
    } catch (err) {
      console.error("Migration error:", err);
      setError(err instanceof Error ? err.message : "Unknown error during migration");
      return false;
    } finally {
      setIsMigrating(false);
    }
  };
  
  // Check if migration has been run before
  useEffect(() => {
    const migrationFlag = localStorage.getItem('migrationCompleted');
    if (migrationFlag) {
      setIsCompleted(true);
    }
  }, []);
  
  // Run migration automatically if not completed yet
  useEffect(() => {
    if (!isCompleted && !isMigrating) {
      runMigration().then(success => {
        if (success) {
          localStorage.setItem('migrationCompleted', 'true');
        }
      });
    }
  }, [isCompleted, isMigrating]);
  
  return {
    isMigrating,
    isCompleted,
    error,
    runMigration
  };
}
