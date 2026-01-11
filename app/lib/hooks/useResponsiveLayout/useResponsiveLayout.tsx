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

const getFontSizeFromStorage = (): number => {
	const storedNumber = userPreferences.getNumber(FONT_SIZE_PREFERENCES_KEY);
	if (typeof storedNumber === 'number' && !Number.isNaN(storedNumber)) {
		return storedNumber;
	}

	const storedString = userPreferences.getString(FONT_SIZE_PREFERENCES_KEY);
	const parsed = storedString !== null ? Number(storedString) : undefined;
	if (!Number.isNaN(parsed ?? NaN)) {
		// Normalize storage to numeric to avoid mixed types across the app.
		userPreferences.setNumber(FONT_SIZE_PREFERENCES_KEY, parsed as number);
		return parsed as number;
	}

	// Default to normal size if nothing is set or parsing failed.
	userPreferences.setNumber(FONT_SIZE_PREFERENCES_KEY, FONT_SIZE_OPTIONS.NORMAL);
	return FONT_SIZE_OPTIONS.NORMAL;
};

const ResponsiveLayoutProvider = ({ children }: IResponsiveFontScaleProviderProps) => {
	// `fontScale` is the current font scaling value of the device.
	const { fontScale: systemFontScale, width, height } = useWindowDimensions();
	const [customFontSize, setCustomFontSize] = useState(() => getFontSizeFromStorage());
	
	useEffect(() => {
		const listener = initializeStorage.addOnValueChangedListener((changedKey: string) => {
			if (changedKey === FONT_SIZE_PREFERENCES_KEY) {
				setCustomFontSize(getFontSizeFromStorage());
			}
		});
		
		return () => listener.remove();
	}, []);

	const fontSizeMultiplier = typeof customFontSize === 'number' && !Number.isNaN(customFontSize) ? customFontSize : 1.0;
	const fontScale = systemFontScale * fontSizeMultiplier;
	const isSmallFont = fontScale < SMALL_FONT_THRESHOLD;
	const baseRowHeight = isSmallFont ? BASE_ROW_HEIGHT_SMALL_FONT : BASE_ROW_HEIGHT;
	const baseRowHeightCondensed = isSmallFont ? BASE_ROW_HEIGHT_CONDENSED_SMALL_FONT : BASE_ROW_HEIGHT_CONDENSED;
	const scaledRowHeight = baseRowHeight * fontScale;
	const scaledRowHeightCondensed = baseRowHeightCondensed * fontScale;
	// Apply cap to prevent extreme scaling
	const rowHeight = Math.min(scaledRowHeight, baseRowHeight * FONT_SCALE_LIMIT);
	const rowHeightCondensed = Math.min(scaledRowHeightCondensed, baseRowHeightCondensed * FONT_SCALE_LIMIT);
	const isLargeFontScale = fontScale > FONT_SCALE_LIMIT;
	// `fontScaleLimited` applies the `FONT_SCALE_LIMIT` to prevent layout issues on large font sizes.
	const fontScaleLimited = isLargeFontScale ? FONT_SCALE_LIMIT : fontScale;

	// Use limited scale for text sizing to avoid unbounded compound scaling.
	const scaleFontSize = useCallback((size: number): number => size * fontScaleLimited, [fontScaleLimited]);

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
