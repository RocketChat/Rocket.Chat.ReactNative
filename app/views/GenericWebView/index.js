import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';

const GenericWebView = ({
	baseUrl, isMasterDetail, navigation, route
}) => {
	const uri = route.params?.uri;
	const headers = route.params?.headers;
	const injectedJavaScript = route.params?.injectedJavaScript;

	useEffect(() => {
		navigation.setOptions({
			headerLeft: isMasterDetail ? undefined : route.params?.leftHeaderButton,
			title: route.params?.title
		});
	}, []);


	if (!baseUrl) {
		return null;
	}
	return (
		<SafeAreaView>
			<StatusBar />
			<WebView
				// https://github.com/react-native-community/react-native-webview/issues/1311
				onMessage={() => {}}
				source={{ uri, headers }}
				injectedJavaScript={injectedJavaScript}
			/>
		</SafeAreaView>
	);
};

GenericWebView.propTypes = {
	baseUrl: PropTypes.string,
	navigation: PropTypes.object,
	route: PropTypes.object,
	isMasterDetail: PropTypes.bool
};

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(GenericWebView);
