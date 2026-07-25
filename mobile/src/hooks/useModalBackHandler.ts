import { useEffect, useRef } from 'react';

export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      pushedRef.current = false;
      return;
    }

    if (!pushedRef.current) {
      window.history.pushState({ ...window.history.state, modalOpen: true }, '');
      pushedRef.current = true;
    }

    const handlePopState = () => {
      if (pushedRef.current) {
        pushedRef.current = false;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  const handleManualClose = () => {
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    }
    onClose();
  };

  return { handleManualClose };
}
