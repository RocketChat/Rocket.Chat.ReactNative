import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

interface IResponsiveLayoutContextData {
	fontScale: number;
	isLargeFontScale: boolean;
	rowHeight: number;
	rowHeightCondensed: number;
}

interface IResponsiveFontScaleProviderProps {
	children: React.ReactNode;
}

export const ResponsiveLayoutContext = createContext({} as IResponsiveLayoutContextData);

const ResponsiveLayoutProvider = ({ children }: IResponsiveFontScaleProviderProps) => {
	const { fontScale } = useWindowDimensions();
	const isLargeFontScale = fontScale > 1.3;
	const rowHeight = 75 * fontScale;
	const rowHeightCondensed = 60 * fontScale;

	return (
		<ResponsiveLayoutContext.Provider value={{ fontScale, isLargeFontScale, rowHeight, rowHeightCondensed }}>
			{children}
		</ResponsiveLayoutContext.Provider>
	);
};

export const useResponsiveLayout = () => {
	const context = useContext(ResponsiveLayoutContext);

	return context;
};

export default ResponsiveLayoutProvider;
