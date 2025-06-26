import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

interface IResponsiveLayoutContextData {
	fontScale: number;
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

const ResponsiveLayoutProvider = ({ children }: IResponsiveFontScaleProviderProps) => {
	const { fontScale } = useWindowDimensions();
	const isLargeFontScale = fontScale > FONT_SCALE_LIMIT;
	const fontScaleLimited = isLargeFontScale ? 1.3 : fontScale;
	const rowHeight = 75 * fontScale;
	const rowHeightCondensed = 60 * fontScale;

	return (
		<ResponsiveLayoutContext.Provider value={{ fontScale, isLargeFontScale, fontScaleLimited, rowHeight, rowHeightCondensed }}>
			{children}
		</ResponsiveLayoutContext.Provider>
	);
};

export const useResponsiveLayout = () => {
	const context = useContext(ResponsiveLayoutContext);

	return context;
};

export default ResponsiveLayoutProvider;
