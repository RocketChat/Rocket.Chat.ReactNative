import React, { useEffect, useState } from 'react';
import WebView from 'react-native-webview';
import { TouchableOpacity, View, Dimensions, ScrollView, BackHandler } from 'react-native';
import { HeaderBackButton } from '@react-navigation/elements';
import { shallowEqual, useSelector } from 'react-redux';
import { IApplicationState } from 'definitions';

import NioniumAiSvg from '../../static/svg/NioniumAi';
import { ThemeContext } from '../../theme';
import { getUserSelector } from '../../selectors/login';

const screenHeight = Dimensions.get('window').height;

const WebViewAI = ({ navigation, header }: { navigation: any; header: any; timestamp: any }): JSX.Element => {
	const [isVisible, setIsVisible] = useState(false);
	const { theme } = React.useContext(ThemeContext);
	const { id } = useSelector(
		(state: IApplicationState) => ({
			id: getUserSelector(state).nionium_token
		}),
		shallowEqual
	);

	const openWebView = () => {
		setIsVisible(true);
	};

	const closeWebView = () => {
		setIsVisible(false);
	};

	useEffect(() => {
		if (isVisible) {
			const backAction = () => {
				setIsVisible(false);
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
				headerLeft: () => <HeaderBackButton onPress={closeWebView} tintColor='white' />,
				headerRight: () => null,

				gestureEnabled: false
			});
		} else {
			const options = header();
			navigation.setOptions(options);
		}
	}, [isVisible, navigation, theme, header]);

	return (
		<View>
			<TouchableOpacity
				style={{ display: !isVisible ? 'flex' : 'none', position: 'absolute', bottom: 50, right: 20 }}
				onPress={openWebView}
			>
				<NioniumAiSvg />
			</TouchableOpacity>
			<ScrollView contentContainerStyle={{ height: screenHeight - 60 }} style={{ display: isVisible ? 'flex' : 'none' }}>
				<WebView
					incognito={true}
					cacheEnabled={false}
					originWhitelist={['*']}
					source={{ uri: `https://app.nionium.ai/${id ? `?externalAuthCode=${id}` : ''}` }}
				/>
			</ScrollView>
		</View>
	);
};

export default WebViewAI;
