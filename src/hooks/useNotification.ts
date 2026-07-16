import { useState, useCallback, useRef, useEffect } from "react";

export interface NotificationMessage {
  text: string;
  type: "success" | "error";
}

export function useNotification() {
  const [statusMessage, setStatusMessage] = useState<NotificationMessage | null>(null);
  const timeoutRef = useRef<any>(null);

  const clearNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatusMessage(null);
  }, []);

  const showNotification = useCallback((text: string, type: "success" | "error") => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatusMessage({ text, type });
    if (type === "success") {
      timeoutRef.current = setTimeout(() => {
        setStatusMessage(null);
        timeoutRef.current = null;
      }, 4000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    statusMessage,
    showNotification,
    clearNotification
  };
}

