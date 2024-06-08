import React, { useEffect, useRef, useState } from 'react';
import WebView from 'react-native-webview';
import {
	TouchableOpacity,
	Dimensions,
	BackHandler,
	View,
	ActivityIndicator,
	Text,
	KeyboardAvoidingView,
	Platform
} from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

import NioniumAiSvg from '../../static/svg/NioniumAi';
import { ThemeContext } from '../../theme';
import { useDrawerStyle } from '../../stacks/MasterDetailStack/DrawerNavigationStyleProvider';

const screenHeight = Dimensions.get('window').height;

const WebViewAI = ({
	navigation,
	header
}: {
	navigation: any;
	isMasterDetail: any;
	header: any;
	timestamp: any;
}): JSX.Element => {
	const [isVisible, setIsVisible] = useState(false);
	const { theme } = React.useContext(ThemeContext);
	const [loader, setLoader] = useState(true);
	const webViewRef = useRef(null);
	const [token, setToken] = useState(-1);
	const { setDrawerStyle } = useDrawerStyle();

	const openWebView = () => {
		if (DeviceInfo.isTablet()) {
			setDrawerStyle({
				drawer: { width: '100%' },
				header: {
					headerTitle: () => <Text>Nionium AI</Text>,
					headerLeft: () => <HeaderBackButton onPress={closeWebView} tintColor={theme === 'light' ? 'black' : 'white'} />,
					headerRight: () => null,
					headerTintColor: '#FFF',
					gestureEnabled: false
				}
			});
		}
		setIsVisible(true);
	};

	const closeWebView = () => {
		if (webViewRef.current) {
			webViewRef.current.injectJavaScript(`document.activeElement.blur();`);
		}
		setDrawerStyle({ drawer: { width: 320 }, header: header() });

		setIsVisible(false);
	};

	useEffect(() => {
		if (isVisible) {
			const backAction = () => {
				setIsVisible(false);
				if (webViewRef.current) {
					webViewRef.current.injectJavaScript(`document.activeElement.blur();`);
				}
				return true;
			};

			const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

			return () => backHandler.remove();
		}
	}, [isVisible]);

	useEffect(() => {
		if (isVisible) {
			navigation.setOptions({
				headerTitle: 'Nionium AI',
				headerLeft: () => <HeaderBackButton onPress={closeWebView} tintColor={theme === 'light' ? 'black' : 'white'} />,
				headerRight: () => null,

				gestureEnabled: false
			});
		} else {
			const options = header();
			navigation.setOptions(options);
		}
	}, [isVisible, navigation, theme, header]);

	const get_token = async () => {
		const token = await AsyncStorage.getItem('nionium_token');
		setToken(token);
	};

	useEffect(() => {
		get_token();
	}, []);

	const renderLoader = () => {
		if (isVisible && (loader || token === -1)) {
			return (
				<View style={{ display: 'flex', height: screenHeight, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator />
				</View>
			);
		}
	};
	return (
		<>
			<TouchableOpacity
				style={{ display: !isVisible ? 'flex' : 'none', position: 'absolute', bottom: 50, right: 20 }}
				onPress={openWebView}
			>
				<NioniumAiSvg />
			</TouchableOpacity>
			<View style={{ height: screenHeight - 56, display: isVisible ? 'flex' : 'none' }}>
				{renderLoader()}
				<KeyboardAvoidingView
					behavior={Platform.OS === 'android' ? 'padding' : undefined}
					keyboardVerticalOffset={100}
					style={{ flex: 1, backgroundColor: 'rgb(17,19,23)' }}
				>
					<WebView
						allowsBackForwardNavigationGestures
						ref={webViewRef}
						onContentProcessDidTerminate={() => webViewRef.current.reload()}
						scrollEnabled={true}
						onLoad={() => {
							setTimeout(() => {
								setLoader(false);
							}, 3000);
						}}
						incognito={true}
						originWhitelist={['*']}
						source={{ uri: `https://app.nionium.ai/${token ? `?externalAuthCode=${token}` : ''}` }}
					/>
				</KeyboardAvoidingView>
			</View>
		</>
	);
};

export default WebViewAI;
