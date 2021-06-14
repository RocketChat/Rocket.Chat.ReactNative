import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import StatusBar from '../../containers/StatusBar';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';

class GenericWebView extends React.Component {
	static navigationOptions = ({ isMasterDetail, route }) => ({
		headerLeft: isMasterDetail ? undefined : route.params?.leftHeaderButton,
		title: route.params?.title
	})

	static propTypes = {
		baseUrl: PropTypes.string,
		route: PropTypes.object
	}

	constructor(props) {
		super(props);
		const { route } = this.props;
		this.uri = route.params?.uri;
		this.headers = route.params?.headers;
		this.injectedJavaScript = route.params?.injectedJavaScript;
	}


	render() {
		const { baseUrl } = this.props;


		if (!baseUrl) {
			return null;
		}
		return (
			<SafeAreaView>
				<StatusBar />
				<WebView
					// https://github.com/react-native-community/react-native-webview/issues/1311
					onMessage={() => {}}
					source={{ uri: this.uri, headers: this.headers }}
					injectedJavaScript={this.injectedJavaScript}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server
});

export default connect(mapStateToProps)(withTheme(GenericWebView));
