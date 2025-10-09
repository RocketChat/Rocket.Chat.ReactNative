import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';

import { useActionSheet } from '../../ActionSheet'; 

interface TimestampPickerContextType {
  showTimestampPicker: boolean;
  openTimestampPicker: () => void;
  closeTimestampPicker: () => void;
}

const TimestampPickerContext = createContext<TimestampPickerContextType>({
  showTimestampPicker: false,
  openTimestampPicker: () => {},
  closeTimestampPicker: () => {}
});

export const TimestampPickerProvider = ({ children }: { children: ReactNode }) => {
  const [showTimestampPicker, setShowTimestampPicker] = useState(false);
  const { hideActionSheet } = useActionSheet(); 

  const openTimestampPicker = useCallback(() => {
    hideActionSheet();
    setShowTimestampPicker(true);
  }, [hideActionSheet]);

  const closeTimestampPicker = useCallback(() => {
    setShowTimestampPicker(false);
  }, []);

  return (
    <TimestampPickerContext.Provider value={{
      showTimestampPicker,
      openTimestampPicker,
      closeTimestampPicker
    }}>
      {children}
    </TimestampPickerContext.Provider>
  );
};

export const useTimestampPicker = () => useContext(TimestampPickerContext);

