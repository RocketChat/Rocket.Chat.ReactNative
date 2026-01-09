import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { FONT_SIZE_PREFERENCES_KEY } from '../../constants/keys';
import userPreferences from '../../methods/userPreferences';

interface IResponsiveLayoutContextData {
	fontScale: number;
	width: number;
	height: number;
	isLargeFontScale: boolean;
	fontScaleLimited: number;
	rowHeight: number;
	rowHeightCondensed: number;
	scaleFontSize: (size: number) => number;
}

interface IResponsiveFontScaleProviderProps {
	children: React.ReactNode;
}

export const ResponsiveLayoutContext = createContext({} as IResponsiveLayoutContextData);

export const FONT_SCALE_LIMIT = 1.3;
export const BASE_ROW_HEIGHT = 75;
export const BASE_ROW_HEIGHT_CONDENSED = 60;
export const BASE_ROW_HEIGHT_SMALL_FONT = 82;
export const BASE_ROW_HEIGHT_CONDENSED_SMALL_FONT = 68;
const SMALL_FONT_THRESHOLD = 0.9;

// Font size options: Small (0.9), Normal (1.0), Large (1.1), Extra Large (1.2)
export const FONT_SIZE_OPTIONS = {
	SMALL: 0.9,
	NORMAL: 1.0,
	LARGE: 1.1,
	EXTRA_LARGE: 1.2
};

const ResponsiveLayoutProvider = ({ children }: IResponsiveFontScaleProviderProps) => {
	// `fontScale` is the current font scaling value of the device.
	const { fontScale: systemFontScale, width, height } = useWindowDimensions();
	const [updateTrigger, setUpdateTrigger] = useState(0);
	
	// Poll for font size changes (simple approach since MMKV doesn't have change listeners)
	useEffect(() => {
		const interval = setInterval(() => {
			setUpdateTrigger(prev => prev + 1);
		}, 500); // Check every 500ms for font size changes
		
		return () => clearInterval(interval);
	}, []);
	
	// Read custom font size directly from storage (MMKV is fast and synchronous)
	// updateTrigger is used to force re-render when font size changes
	const customFontSize = userPreferences.getString(FONT_SIZE_PREFERENCES_KEY) || FONT_SIZE_OPTIONS.NORMAL.toString();
	// Reference updateTrigger to ensure component re-renders when it changes
	if (updateTrigger) {
		// This ensures the value is re-read on each render when updateTrigger changes
	}

	// Use custom font size if set, otherwise use system font scale
	const fontSizeMultiplier = customFontSize ? parseFloat(customFontSize) : 1.0;
	const fontScale = systemFontScale * fontSizeMultiplier;
	const isLargeFontScale = fontScale > FONT_SCALE_LIMIT;
	// `fontScaleLimited` applies the `FONT_SCALE_LIMIT` to prevent layout issues on large font sizes.
	const fontScaleLimited = isLargeFontScale ? FONT_SCALE_LIMIT : fontScale;
	// Use increased height only for smallest font sizes to prevent text cutting
	const isSmallFont = fontScale < SMALL_FONT_THRESHOLD;
	const baseRowHeight = isSmallFont ? BASE_ROW_HEIGHT_SMALL_FONT : BASE_ROW_HEIGHT;
	const baseRowHeightCondensed = isSmallFont ? BASE_ROW_HEIGHT_CONDENSED_SMALL_FONT : BASE_ROW_HEIGHT_CONDENSED;
	const rowHeight = baseRowHeight * fontScale;
	const rowHeightCondensed = baseRowHeightCondensed * fontScale;

	// Function to scale font sizes based on custom font size preference
	const scaleFontSize = (size: number): number => size * fontSizeMultiplier;

	return (
		<ResponsiveLayoutContext.Provider
			value={{ fontScale, width, height, isLargeFontScale, fontScaleLimited, rowHeight, rowHeightCondensed, scaleFontSize }}>
			{children}
		</ResponsiveLayoutContext.Provider>
	);
};

export const useResponsiveLayout = () => {
	const context = useContext(ResponsiveLayoutContext);

	return context;
};

export default ResponsiveLayoutProvider;
