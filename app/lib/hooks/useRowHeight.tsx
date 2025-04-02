import React, { createContext, ReactElement, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

interface IRowHeightProvider {
	children: ReactElement | null;
}

interface IRowHeightContextProps {
	rowHeight: number;
	rowHeightCondensed: number;
}

const RowHeightContext = createContext<IRowHeightContextProps>({} as IRowHeightContextProps);

export const RowHeightProvider = ({ children }: IRowHeightProvider) => {
	const { fontScale } = useWindowDimensions();

	const rowHeight = 75 * fontScale;
	const rowHeightCondensed = 60 * fontScale;

	return <RowHeightContext.Provider value={{ rowHeight, rowHeightCondensed }}>{children}</RowHeightContext.Provider>;
};

export const useRowHeight = () => {
	const context = useContext(RowHeightContext);

	return context;
};
