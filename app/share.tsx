import React, { useContext } from 'react';
import { Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';

import { getTheme, initialTheme, newThemeState, subscribeTheme, unsubscribeTheme } from './lib/methods/helpers/theme';
import UserPreferences from './lib/methods/userPreferences';
import Navigation from './lib/navigation/shareNavigation';
import store from './lib/store';
import { initStore } from './lib/store/auxStore';
import { closeShareExtension, shareExtensionInit } from './lib/methods/shareExtension';
import { defaultHeader, getActiveRouteName, navigationTheme, themedHeader } from './lib/methods/helpers/navigation';
import { ThemeContext, TSupportedThemes } from './theme';
import { localAuthenticate } from './lib/methods/helpers/localAuthentication';
import { IThemePreference } from './definitions/ITheme';
import ScreenLockedView from './views/ScreenLockedView';
// Outside Stack
import WithoutServersView from './views/WithoutServersView';
// Inside Stack
import ShareListView from './views/ShareListView';
import ShareView from './views/ShareView';
import SelectServerView from './views/SelectServerView';
import { setCurrentScreen } from './lib/methods/helpers/log';
import AuthLoadingView from './views/AuthLoadingView';
import { DimensionsContext } from './dimensions';
import { debounce } from './lib/methods/helpers';
import { ShareInsideStackParamList, ShareOutsideStackParamList, ShareAppStackParamList } from './definitions/navigationTypes';
import { colors, CURRENT_SERVER } from './lib/constants';

initStore(store);

interface IDimensions {
	width: number;
	height: number;
	scale: number;
	fontScale: number;
}

interface IState {
	theme: TSupportedThemes;
	themePreferences: IThemePreference;
	root: any;
	width: number;
	height: number;
	scale: number;
	fontScale: number;
}

const Inside = createStackNavigator<ShareInsideStackParamList>();
const InsideStack = () => {
	const { theme } = useContext(ThemeContext);

	const screenOptions = {
		...defaultHeader,
		...themedHeader(theme)
	};
	screenOptions.headerStyle = { ...screenOptions.headerStyle, height: 57 };

	return (
		<Inside.Navigator screenOptions={screenOptions}>
			<Inside.Screen name='ShareListView' component={ShareListView} />
			<Inside.Screen name='ShareView' component={ShareView} />
			<Inside.Screen name='SelectServerView' component={SelectServerView} options={SelectServerView.navigationOptions} />
		</Inside.Navigator>
	);
};

const Outside = createStackNavigator<ShareOutsideStackParamList>();
const OutsideStack = () => {
	const { theme } = useContext(ThemeContext);

	return (
		<Outside.Navigator screenOptions={{ ...defaultHeader, ...themedHeader(theme) }}>
			<Outside.Screen name='WithoutServersView' component={WithoutServersView} options={WithoutServersView.navigationOptions} />
		</Outside.Navigator>
	);
};

// App
const Stack = createStackNavigator<ShareAppStackParamList>();
export const App = ({ root }: any) => (
	<Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
		<>
			{!root ? <Stack.Screen name='AuthLoading' component={AuthLoadingView} /> : null}
			{root === 'outside' ? <Stack.Screen name='OutsideStack' component={OutsideStack} /> : null}
			{root === 'inside' ? <Stack.Screen name='InsideStack' component={InsideStack} /> : null}
		</>
	</Stack.Navigator>
);

class Root extends React.Component<{}, IState> {
	private mounted = false;

	constructor(props: any) {
		super(props);
		const { width, height, scale, fontScale } = Dimensions.get('screen');
		const theme = initialTheme();
		this.state = {
			theme: getTheme(theme),
			themePreferences: theme,
			root: '',
			width,
			height,
			scale,
			fontScale
		};
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
	}

	componentWillUnmount(): void {
		closeShareExtension();
		unsubscribeTheme();
	}

	init = async () => {
		const currentServer = UserPreferences.getString(CURRENT_SERVER);

		if (currentServer) {
			await localAuthenticate(currentServer);
			this.setState({ root: 'inside' });
			await shareExtensionInit(currentServer);
		} else if (this.mounted) {
			this.setState({ root: 'outside' });
		} else {
			// @ts-ignore
			this.state.root = 'outside';
		}

		const state = Navigation.navigationRef.current?.getRootState();
		const currentRouteName = getActiveRouteName(state);
		Navigation.routeNameRef.current = currentRouteName;
		setCurrentScreen(currentRouteName);
	};

	setTheme = (newTheme = {}) => {
		// change theme state
		this.setState(
			prevState => newThemeState(prevState, newTheme as IThemePreference),
			() => {
				const { themePreferences } = this.state;
				// subscribe to Appearance changes
				subscribeTheme(themePreferences, this.setTheme);
			}
		);
	};

	// Dimensions update fires twice
	onDimensionsChange = debounce(({ window: { width, height, scale, fontScale } }: { window: IDimensions }) => {
		this.setDimensions({ width, height, scale, fontScale });
	});

	setDimensions = ({ width, height, scale, fontScale }: IDimensions) => {
		this.setState({
			width,
			height,
			scale,
			fontScale
		});
	};

	render() {
		const { theme, root, width, height, scale, fontScale } = this.state;
		const navTheme = navigationTheme(theme);
		return (
			<Provider store={store}>
				<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
					<DimensionsContext.Provider
						value={{
							width,
							height,
							scale,
							fontScale,
							setDimensions: this.setDimensions
						}}
					>
						<NavigationContainer
							theme={navTheme}
							ref={Navigation.navigationRef}
							onStateChange={state => {
								const previousRouteName = Navigation.routeNameRef.current;
								const currentRouteName = getActiveRouteName(state);
								if (previousRouteName !== currentRouteName) {
									setCurrentScreen(currentRouteName);
								}
								Navigation.routeNameRef.current = currentRouteName;
							}}
						>
							<App root={root} />
						</NavigationContainer>
						<ScreenLockedView />
					</DimensionsContext.Provider>
				</ThemeContext.Provider>
			</Provider>
		);
	}
}

export default Root;
