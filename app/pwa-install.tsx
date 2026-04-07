'use client';
import { useEffect } from 'react';

export default function PWAInstall() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
  }, []);
  return null;
}