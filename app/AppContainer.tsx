import { useContext, useEffect } from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import { type IApplicationState, RootEnum } from './definitions';
import Navigation from './lib/navigation/appNavigation';
import { useMasterDetail } from './lib/hooks/useMasterDetail';
import { defaultHeader, getActiveRouteName, navigationTheme } from './lib/methods/helpers/navigation';
import OutsideStack from './stacks/OutsideStack';
import InsideStack from './stacks/InsideStack';
import MasterDetailStack from './stacks/MasterDetailStack';
import ShareExtensionStack from './stacks/ShareExtensionStack';
import AuthLoadingView from './views/AuthLoadingView';
import SetUsernameView from './views/SetUsernameView';
import { ThemeContext } from './theme';
import { setCurrentScreen } from './lib/methods/helpers/log';
import { themes } from './lib/constants/colors';
import { emitter } from './lib/methods/helpers';
import MediaCallHeader from './containers/MediaCallHeader/MediaCallHeader';

const useIsLoading = () =>
	useSelector(
		(state: IApplicationState) =>
			state.app.root === RootEnum.ROOT_LOADING || state.app.root === RootEnum.ROOT_LOADING_SHARE_EXTENSION
	);

const useIsOutside = () => useSelector((state: IApplicationState) => state.app.root === RootEnum.ROOT_OUTSIDE);

const useIsMasterDetail = () => {
	const isMasterDetail = useMasterDetail();
	return useSelector((state: IApplicationState) => state.app.root === RootEnum.ROOT_INSIDE) && isMasterDetail;
};

const useIsInside = () => {
	const isMasterDetail = useMasterDetail();
	return useSelector((state: IApplicationState) => state.app.root === RootEnum.ROOT_INSIDE) && !isMasterDetail;
};

const useIsSetUsername = () => useSelector((state: IApplicationState) => state.app.root === RootEnum.ROOT_SET_USERNAME);

const useIsShareExtension = () => useSelector((state: IApplicationState) => state.app.root === RootEnum.ROOT_SHARE_EXTENSION);

const SetUsernameStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: { SetUsernameView }
});

const RootNavigator = createNativeStackNavigator({
	screenOptions: { headerShown: false, animation: 'none' },
	groups: {
		Loading: { if: useIsLoading, screens: { AuthLoading: AuthLoadingView } },
		Outside: { if: useIsOutside, screens: { OutsideStack } },
		MasterDetail: { if: useIsMasterDetail, screens: { MasterDetailStack } },
		Inside: { if: useIsInside, screens: { InsideStack } },
		SetUsername: { if: useIsSetUsername, screens: { SetUsernameStack } },
		ShareExtension: { if: useIsShareExtension, screens: { ShareExtensionStack } }
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={{ navigationBarColor: themes[theme].surfaceLight }} />;
});

const AppNavigation = createStaticNavigation(RootNavigator);

const AppContainer = () => {
	const { theme } = useContext(ThemeContext);
	const root = useSelector((state: IApplicationState) => state.app.root);

	useEffect(() => {
		if (root) {
			const state = Navigation.navigationRef.current?.getRootState();
			const currentRouteName = getActiveRouteName(state);
			Navigation.routeNameRef.current = currentRouteName;
			setCurrentScreen(currentRouteName);
		}
	}, [root]);

	if (!root) {
		return null;
	}

	return (
		<>
			<MediaCallHeader />
			<AppNavigation
				theme={navigationTheme(theme)}
				ref={Navigation.navigationRef}
				onReady={() => {
					emitter.emit('navigationReady');
				}}
				onStateChange={state => {
					const previousRouteName = Navigation.routeNameRef.current;
					const currentRouteName = getActiveRouteName(state);
					if (previousRouteName !== currentRouteName) {
						setCurrentScreen(currentRouteName);
					}
					Navigation.routeNameRef.current = currentRouteName;
				}}
			/>
		</>
	);
};

export default AppContainer;
