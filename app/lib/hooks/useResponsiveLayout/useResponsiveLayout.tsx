import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

interface IResponsiveLayoutContextData {
	fontScale: number;
	width: number;
	height: number;
	isLargeFontScale: boolean;
	fontScaleLimited: number;
	rowHeight: number;
	rowHeightCondensed: number;
}

interface IResponsiveFontScaleProviderProps {
	children: React.ReactNode;
}

export const ResponsiveLayoutContext = createContext({} as IResponsiveLayoutContextData);

export const FONT_SCALE_LIMIT = 1.3;
export const BASE_ROW_HEIGHT = 75;
export const BASE_ROW_HEIGHT_CONDENSED = 60;

const ResponsiveLayoutProvider = ({ children }: IResponsiveFontScaleProviderProps) => {
	// `fontScale` is the current font scaling value of the device.
	const { fontScale, width, height } = useWindowDimensions();
	const isLargeFontScale = fontScale > FONT_SCALE_LIMIT;
	// `fontScaleLimited` applies the `FONT_SCALE_LIMIT` to prevent layout issues on large font sizes.
	const fontScaleLimited = isLargeFontScale ? FONT_SCALE_LIMIT : fontScale;
	const rowHeight = BASE_ROW_HEIGHT * fontScale;
	const rowHeightCondensed = BASE_ROW_HEIGHT_CONDENSED * fontScale;

	return (
		<ResponsiveLayoutContext.Provider
			value={{ fontScale, width, height, isLargeFontScale, fontScaleLimited, rowHeight, rowHeightCondensed }}>
			{children}
		</ResponsiveLayoutContext.Provider>
	);
};

export const useResponsiveLayout = () => {
	const context = useContext(ResponsiveLayoutContext);

	return context;
};

export default ResponsiveLayoutProvider;
