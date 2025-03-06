import React, { createContext, ReactElement, useContext } from 'react';
import { PixelRatio } from 'react-native';

interface IRowHeightProvider {
	children: ReactElement | null;
}

interface IRowHeightContextProps {
	ROW_HEIGHT: number;
	ROW_HEIGHT_CONDENSED: number;
}

const RowHeightContext = createContext<IRowHeightContextProps>({} as IRowHeightContextProps);

export const RowHeightProvider = ({ children }: IRowHeightProvider) => {
	const RowHeight = PixelRatio.getFontScale();
	const ROW_HEIGHT = 75 * RowHeight;
	const ROW_HEIGHT_CONDENSED = 60 * RowHeight;

	return <RowHeightContext.Provider value={{ ROW_HEIGHT, ROW_HEIGHT_CONDENSED }}>{children}</RowHeightContext.Provider>;
};

export const useRowHeight = () => {
	const context = useContext(RowHeightContext);

	return context;
};
