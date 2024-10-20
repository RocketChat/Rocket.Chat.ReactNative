import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DrawerContentOptions } from '@react-navigation/drawer';

interface DrawerStyleContextProps {
	drawerStyle: DrawerContentOptions['drawerStyle'];
	setDrawerStyle: React.Dispatch<React.SetStateAction<DrawerContentOptions['drawerStyle']>>;
}

export const DrawerStyleContext = createContext<DrawerStyleContextProps | undefined>({ drawer: { width: 320 }, header: {} });

export const useDrawerStyle = (): DrawerStyleContextProps => {
	const context = useContext(DrawerStyleContext);
	if (!context) {
		throw new Error('useDrawerStyle must be used within a DrawerStyleProvider');
	}
	return context;
};

export const DrawerStyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [drawerStyle, setDrawerStyle] = useState<DrawerContentOptions['drawerStyle']>({});

	return <DrawerStyleContext.Provider value={{ drawerStyle, setDrawerStyle }}>{children}</DrawerStyleContext.Provider>;
};
