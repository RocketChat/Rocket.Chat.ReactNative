import { useEffect } from 'react';
import { Dimensions, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import RNBootSplash from 'react-native-bootsplash';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';

import { setUser } from '../actions/login';
import { selectServerRequest } from '../actions/server';
import { ActionSheetProvider } from '../containers/ActionSheet';
import { DimensionsContext } from '../dimensions';
import { colors } from '../lib/constants/colors';
import database from '../lib/database';
import ResponsiveLayoutProvider from '../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { initStore } from '../lib/store/auxStore';
import { createMockedStore } from '../reducers/mockedStore';
import { ThemeContext } from '../theme';
import OwlScreensNavigator from './OwlScreensNavigator';

const styles = StyleSheet.create({
	fill: {
		flex: 1
	}
});

const baseUrl = 'https://open.rocket.chat';
const store = createMockedStore();

initStore(store);
store.dispatch(selectServerRequest(baseUrl, '8.0.0'));
store.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'] }));
// Real screens (RoomsListView) read from the active WatermelonDB. Set it up so
// subscription queries resolve to an empty, deterministic state instead of
// crashing on an undefined database.
database.setActiveDB(baseUrl);

// Seed the servers DB so the ServersList action sheet shows real workspace rows.
// The first one matches the active server, so it renders with the selected check.
// Empty iconURL makes ServerItem fall back to the bundled logo (no network).
const MOCK_SERVERS = [
	{ id: baseUrl, name: 'Rocket.Chat' },
	{ id: 'https://team.rocket.chat', name: 'Rocket.Chat Team' },
	{ id: 'https://community.rocket.chat', name: 'Community' }
];

const seedMockServers = async () => {
	const serversCollection = database.servers.get('servers');
	const count = await serversCollection.query().fetchCount();
	if (count > 0) {
		return;
	}
	await database.servers.write(async () => {
		await Promise.all(
			MOCK_SERVERS.map(server =>
				serversCollection.create((record: any) => {
					record._raw.id = server.id;
					record.name = server.name;
					record.iconURL = '';
					record.version = '8.0.0';
				})
			)
		);
	});
};

seedMockServers();

/**
 * Owl host that renders the real application screens inside the same provider
 * tree as `app/index.tsx` (store, theme, responsive layout, dimensions, gesture
 * handler, keyboard, action sheet) plus a NavigationContainer + native stack so
 * each screen mounts with its real header/triggers. The Owl test navigates to a
 * screen and opens its real action sheet, so baselines are real screens.
 */
const OwlRoot = () => {
	useEffect(() => {
		RNBootSplash.hide({ fade: false });
	}, []);

	const { width, height, scale, fontScale } = Dimensions.get('window');

	return (
		<SafeAreaProvider style={styles.fill}>
			<Provider store={store}>
				<ThemeContext.Provider
					value={{
						theme: 'light',
						colors: colors.light
					}}>
					<ResponsiveLayoutProvider>
						<DimensionsContext.Provider value={{ width, height, scale, fontScale, setDimensions: () => {} }}>
							<GestureHandlerRootView style={styles.fill}>
								<KeyboardProvider>
									<ActionSheetProvider>
										<StatusBar backgroundColor={colors.light.surfaceTint} barStyle='dark-content' />
										<NavigationContainer>
											<OwlScreensNavigator />
										</NavigationContainer>
									</ActionSheetProvider>
								</KeyboardProvider>
							</GestureHandlerRootView>
						</DimensionsContext.Provider>
					</ResponsiveLayoutProvider>
				</ThemeContext.Provider>
			</Provider>
		</SafeAreaProvider>
	);
};

export default OwlRoot;
