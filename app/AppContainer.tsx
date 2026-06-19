import { useContext, useEffect } from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import { RootEnum } from './definitions';
import Navigation from './lib/navigation/appNavigation';
import { defaultHeader, getActiveRouteName, navigationTheme } from './lib/methods/helpers/navigation';
// Stacks — navigator config objects, not components
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

// ─── Conditional-group hooks ──────────────────────────────────────────────────

const useIsLoading = () =>
	useSelector(
		(state: any) => state.app.root === RootEnum.ROOT_LOADING || state.app.root === RootEnum.ROOT_LOADING_SHARE_EXTENSION
	);

const useIsOutside = () => useSelector((state: any) => state.app.root === RootEnum.ROOT_OUTSIDE);

const useIsMasterDetail = () => useSelector((state: any) => state.app.root === RootEnum.ROOT_INSIDE && state.app.isMasterDetail);

const useIsInside = () => useSelector((state: any) => state.app.root === RootEnum.ROOT_INSIDE && !state.app.isMasterDetail);

const useIsSetUsername = () => useSelector((state: any) => state.app.root === RootEnum.ROOT_SET_USERNAME);

const useIsShareExtension = () => useSelector((state: any) => state.app.root === RootEnum.ROOT_SHARE_EXTENSION);

// ─── SetUsername inline navigator ────────────────────────────────────────────

const SetUsernameStack = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: { SetUsernameView }
});

// ─── Root navigator ───────────────────────────────────────────────────────────

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

// ─── Root component ───────────────────────────────────────────────────────────

const AppContainer = () => {
	const { theme } = useContext(ThemeContext);
	const root = useSelector((state: any) => state.app.root);

	useEffect(() => {
		if (root) {
			const state = Navigation.navigationRef.current?.getRootState();
			const currentRouteName = getActiveRouteName(state);
			Navigation.routeNameRef.current = currentRouteName;
			setCurrentScreen(currentRouteName);
		}
	}, [root]);

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
