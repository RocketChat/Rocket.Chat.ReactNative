import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RNBootSplash from 'react-native-bootsplash';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { setUser } from '../actions/login';
import { selectServerRequest } from '../actions/server';
import MessageContext from '../containers/message/Context';
import { colors } from '../lib/constants/colors';
import { initStore } from '../lib/store/auxStore';
import { createMockedStore } from '../reducers/mockedStore';
import { ThemeContext } from '../theme';
import { renderOwlFixture } from './fixtures';

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

type Props = {
	fixture?: string;
};

const OwlRoot = ({ fixture }: Props) => {
	React.useEffect(() => {
		RNBootSplash.hide({ fade: false });
	}, []);

	return (
		<SafeAreaProvider style={styles.fill}>
			<Provider store={store}>
				<ThemeContext.Provider
					value={{
						theme: 'light',
						colors: colors.light
					}}>
					<MessageContext.Provider
						value={{
							user: {
								id: 'abc',
								username: 'rocket.cat',
								token: 'owl-token'
							},
							baseUrl,
							onPress: () => {},
							onLongPress: () => {},
							reactionInit: () => {},
							onErrorPress: () => {},
							replyBroadcast: () => {},
							onReactionPress: () => {},
							onDiscussionPress: () => {},
							onReactionLongPress: () => {},
							threadBadgeColor: colors.light.badgeBackgroundLevel1
						}}>
						<GestureHandlerRootView style={styles.fill}>
							<StatusBar backgroundColor={colors.light.surfaceTint} barStyle='dark-content' />
							{renderOwlFixture(fixture)}
						</GestureHandlerRootView>
					</MessageContext.Provider>
				</ThemeContext.Provider>
			</Provider>
		</SafeAreaProvider>
	);
};

export default OwlRoot;
