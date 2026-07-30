import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import LockScreen from './LockScreen';

export default function SecurityWrapper({ children }: { children: React.ReactNode }) {
  const { securitySettings, isAuthenticated } = useStore();
  const [isLocked, setIsLocked] = useState(securitySettings.pinEnabled && !!securitySettings.pin);
  const lastActivityRef = useRef<number>(Date.now());
  const autoLockTimeRef = useRef(securitySettings.autoLockTime);

  // Keep ref in sync
  useEffect(() => {
    autoLockTimeRef.current = securitySettings.autoLockTime;
    lastActivityRef.current = Date.now(); // reset on setting change
  }, [securitySettings.autoLockTime]);

  useEffect(() => {
    if (isLocked || !isAuthenticated) return;

    let rafId: number;
    const handleActivity = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        lastActivityRef.current = Date.now();
      });
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    const interval = setInterval(() => {
      const lockTime = autoLockTimeRef.current;
      if (lockTime > 0) {
        const inactiveFor = Date.now() - lastActivityRef.current;
        if (inactiveFor >= lockTime * 60 * 1000) {
          setIsLocked(true);
        }
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(rafId);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [isLocked]);

  // Sync initial lock state if settings change
  useEffect(() => {
    if (securitySettings.pinEnabled && !securitySettings.pin) {
      // Don't lock if PIN is enabled but not set
      setIsLocked(false);
    }
    if (!securitySettings.pinEnabled) {
      setIsLocked(false);
    }
  }, [securitySettings.pinEnabled, securitySettings.pin]);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (isLocked) {
    return <LockScreen onUnlock={() => {
      setIsLocked(false);
      lastActivityRef.current = Date.now();
    }} />;
  }

  return <>{children}</>;
}
