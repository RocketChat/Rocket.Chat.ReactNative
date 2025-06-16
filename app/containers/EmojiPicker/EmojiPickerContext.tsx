import React, { createContext, useContext, useState, ReactElement } from 'react';

interface EmojiPickerContextType {
	parentWidth: number;
	setParentWidth: (width: number) => void;
}

const EmojiPickerContext = createContext<EmojiPickerContextType | undefined>(undefined);

export const EmojiPickerProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [parentWidth, setParentWidth] = useState(0);

	return <EmojiPickerContext.Provider value={{ parentWidth, setParentWidth }}>{children}</EmojiPickerContext.Provider>;
};

export const useEmojiPicker = (): EmojiPickerContextType => {
	const context = useContext(EmojiPickerContext);
	if (!context) {
		throw new Error('useEmojiPicker must be used within an EmojiPickerProvider');
	}
	return context;
};
