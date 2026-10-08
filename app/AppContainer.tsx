import { useContext, useEffect } from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
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
import PexipCall from './containers/PexipCall';
import PexipCallSplitSpacer from './containers/PexipCall/PexipCallSplitSpacer';
import { usePexipSplitLayout } from './containers/PexipCall/usePexipSplitLayout';
import { useIsPexipCallSplit } from './lib/services/videoConf/usePexipCallStore';

const styles = StyleSheet.create({
	content: { flex: 1 },
	row: { flexDirection: 'row' }
});

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
	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={{ navigationBarColor: themes[theme].surfaceLight }} />;
});

const AppNavigation = createStaticNavigation(RootNavigator);

const AppContainer = () => {
	const { theme } = useContext(ThemeContext);
	const root = useSelector((state: IApplicationState) => state.app.root);
	const isPexipSplit = useIsPexipCallSplit();
	const { isLandscape } = usePexipSplitLayout();
	const isPexipSplitLandscape = isPexipSplit && isLandscape;

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
			<View style={[styles.content, isPexipSplitLandscape && styles.row]}>
				<PexipCallSplitSpacer />
				<View style={styles.content}>
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
				</View>
			</View>
			<PexipCall />
		</>
	);
};

export default AppContainer;
