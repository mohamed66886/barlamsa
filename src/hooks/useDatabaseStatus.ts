import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DatabaseStatus {
  isConnected: boolean;
  isLoading: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export const useDatabaseStatus = () => {
  const [status, setStatus] = useState<DatabaseStatus>({
    isConnected: false,
    isLoading: true,
    lastChecked: null,
    error: null
  });

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // محاولة قراءة وثيقة تجريبية من Firestore
      const testDoc = await getDoc(doc(db, 'system', 'status'));
      
      setStatus({
        isConnected: true,
        isLoading: false,
        lastChecked: new Date(),
        error: null
      });
    } catch (error) {
      console.error('Database connection error:', error);
      setStatus({
        isConnected: false,
        isLoading: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'خطأ في الاتصال'
      });
    }
  };

  useEffect(() => {
    checkConnection();
    
    // فحص الاتصال كل دقيقة
    const interval = setInterval(checkConnection, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...status,
    checkConnection
  };
};
