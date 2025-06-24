import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

interface IResponsiveLayoutContextData {
	fontScale: number;
	isLargeFontScale: boolean;
}

interface IResponsiveFontScaleProviderProps {
	children: React.ReactNode;
}

export const ResponsiveLayoutContext = createContext({} as IResponsiveLayoutContextData);

const ResponsiveLayoutProvider = ({ children }: IResponsiveFontScaleProviderProps) => {
	const { fontScale } = useWindowDimensions();
	const isLargeFontScale = fontScale > 1.3;

	return <ResponsiveLayoutContext.Provider value={{ fontScale, isLargeFontScale }}>{children}</ResponsiveLayoutContext.Provider>;
};

export const useResponsiveLayout = () => {
	const context = useContext(ResponsiveLayoutContext);

	return context;
};

export default ResponsiveLayoutProvider;
