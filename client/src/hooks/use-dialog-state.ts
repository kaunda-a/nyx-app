import { useState, useCallback } from 'react';

interface DialogState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * A hook to manage dialog state (open/close)
 * @param initialState - Initial open state of the dialog
 * @returns Object with isOpen state and handlers
 */
export default function useDialogState(initialState: boolean = false): DialogState {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    onOpen,
    onClose
  };
}
