import { useEffect, useState } from 'react';
import { type DrawerNavigationProp } from '@react-navigation/drawer';

import { type DrawerParamList } from '~/stacks/types';

const currentRouteName = (navigation: DrawerNavigationProp<DrawerParamList>) => {
	const state = navigation.getState();
	return state.routes[state.index].name;
};

export const useCurrentScreen = (navigation: DrawerNavigationProp<DrawerParamList>) => {
	const [currentScreen, setCurrentScreen] = useState<string>(() => currentRouteName(navigation));

	useEffect(() => {
		const unsubscribe = navigation.addListener('state', () => {
			setCurrentScreen(currentRouteName(navigation));
		});

		return unsubscribe;
	}, [navigation]);

	return currentScreen;
};
