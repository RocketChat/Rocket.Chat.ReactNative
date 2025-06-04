import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

interface IResponsiveFontScaleContextData {
	fontScale: number;
	isLargeFontScale: boolean;
}

interface IResponsiveFontScaleProviderProps {
	children: React.ReactNode;
}

export const ResponsiveFontScaleContext = createContext({} as IResponsiveFontScaleContextData);

const ResponsiveFontScaleProvider = ({ children }: IResponsiveFontScaleProviderProps) => {
	const { fontScale } = useWindowDimensions();
	const isLargeFontScale = fontScale > 1.3;

	return (
		<ResponsiveFontScaleContext.Provider value={{ fontScale, isLargeFontScale }}>{children}</ResponsiveFontScaleContext.Provider>
	);
};

export const useResponsiveFontScale = () => {
	const context = useContext(ResponsiveFontScaleContext);

	return context;
};

export default ResponsiveFontScaleProvider;
