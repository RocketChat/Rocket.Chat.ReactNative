import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { FONT_SIZE_PREFERENCES_KEY } from '../../constants/keys';
import userPreferences, { initializeStorage } from '../../methods/userPreferences';

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

export const FONT_SIZE_OPTIONS = {
	SMALL: 0.9,
	NORMAL: 1.0,
	LARGE: 1.1,
	EXTRA_LARGE: 1.2
};

const ResponsiveLayoutProvider = ({ children }: IResponsiveFontScaleProviderProps) => {
	// `fontScale` is the current font scaling value of the device.
	const { fontScale: systemFontScale, width, height } = useWindowDimensions();
	const [customFontSize, setCustomFontSize] = useState(
		() => userPreferences.getString(FONT_SIZE_PREFERENCES_KEY) || FONT_SIZE_OPTIONS.NORMAL.toString()
	);
	
	useEffect(() => {
		const listener = initializeStorage.addOnValueChangedListener((changedKey: string) => {
			if (changedKey === FONT_SIZE_PREFERENCES_KEY) {
				const newFontSize = userPreferences.getString(FONT_SIZE_PREFERENCES_KEY) || FONT_SIZE_OPTIONS.NORMAL.toString();
				setCustomFontSize(newFontSize);
			}
		});
		
		return () => listener.remove();
	}, []);

	const fontSizeMultiplier = customFontSize ? parseFloat(customFontSize) : 1.0;
	const fontScale = systemFontScale * fontSizeMultiplier;
	const isLargeFontScale = fontScale > FONT_SCALE_LIMIT;
	// `fontScaleLimited` applies the `FONT_SCALE_LIMIT` to prevent layout issues on large font sizes.
	const fontScaleLimited = isLargeFontScale ? FONT_SCALE_LIMIT : fontScale;
	const isSmallFont = fontScale < SMALL_FONT_THRESHOLD;
	const baseRowHeight = isSmallFont ? BASE_ROW_HEIGHT_SMALL_FONT : BASE_ROW_HEIGHT;
	const baseRowHeightCondensed = isSmallFont ? BASE_ROW_HEIGHT_CONDENSED_SMALL_FONT : BASE_ROW_HEIGHT_CONDENSED;
	const rowHeight = baseRowHeight * fontScale;
	const rowHeightCondensed = baseRowHeightCondensed * fontScale;

	const scaleFontSize = useCallback((size: number): number => size * fontSizeMultiplier, [fontSizeMultiplier]);

	const contextValue = useMemo(
		() => ({
			fontScale,
			width,
			height,
			isLargeFontScale,
			fontScaleLimited,
			rowHeight,
			rowHeightCondensed,
			scaleFontSize
		}),
		[fontScale, width, height, isLargeFontScale, fontScaleLimited, rowHeight, rowHeightCondensed, scaleFontSize]
	);

	return <ResponsiveLayoutContext.Provider value={contextValue}>{children}</ResponsiveLayoutContext.Provider>;
};

export const useResponsiveLayout = () => {
	const context = useContext(ResponsiveLayoutContext);

	if (!context || Object.keys(context).length === 0) {
		return {
			fontScale: 1.0,
			width: 0,
			height: 0,
			isLargeFontScale: false,
			fontScaleLimited: 1.0,
			rowHeight: BASE_ROW_HEIGHT,
			rowHeightCondensed: BASE_ROW_HEIGHT_CONDENSED,
			scaleFontSize: (size: number) => size
		};
	}

	return context;
};

export default ResponsiveLayoutProvider;
