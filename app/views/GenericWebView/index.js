import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';

const GenericWebView = ({
	navigation, route
}) => {
	const webView = useRef(null);
	const baseUrl = useSelector(state => state.server.server);
	const isMasterDetail = useSelector(state => state.app.isMasterDetail);

	const uri = route.params?.uri;
	const headers = route.params?.headers;
	const injectedJavaScript = route.params?.injectedJavaScript;

	useEffect(() => {
		navigation.setOptions({
			headerLeft: isMasterDetail ? undefined : route.params?.leftHeaderButton,
			title: route.params?.title
		});
	}, []);


	const checkLoadRequest = (navigator) => {
		const url = navigator.url.toLowerCase();

		// TODO: We could implement a save for files and videos
		if (url.indexOf('.pdf') > -1 || url.indexOf('.doc') > -1) {
			// On iOS we just return false.
			// Android requires us to call stopLoading().
			webView?.current.stopLoading();
			return false;
		}

		return true;
	};

	if (!baseUrl) {
		return null;
	}
	return (
		<SafeAreaView>
			<StatusBar />
			<WebView
				// https://github.com/react-native-community/react-native-webview/issues/1311
				ref={webView}
				onMessage={() => {}}
				source={{ uri, headers }}
				injectedJavaScript={injectedJavaScript}
				mixedContentMode='always'
				mediaPlaybackRequiresUserAction
				allowFileAccess
				javaScriptEnabled
				onShouldStartLoadWithRequest={request => checkLoadRequest(request)}
			/>
		</SafeAreaView>
	);
};

GenericWebView.propTypes = {
	navigation: PropTypes.object,
	route: PropTypes.object
};

export default GenericWebView;
