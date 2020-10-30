import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import * as HeaderButton from '../../containers/HeaderButton';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';

class AdminPanelView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => ({
		headerLeft: isMasterDetail ? undefined : () => <HeaderButton.Drawer navigation={navigation} />,
		title: I18n.t('Admin_Panel')
	})

	static propTypes = {
		baseUrl: PropTypes.string,
		token: PropTypes.string
	}

	render() {
		const { baseUrl, token } = this.props;
		if (!baseUrl) {
			return null;
		}
		return (
			<SafeAreaView>
				<StatusBar />
				<WebView
					// https://github.com/react-native-community/react-native-webview/issues/1311
					onMessage={() => {}}
					source={{ uri: `${ baseUrl }/admin/info?layout=embedded` }}
					injectedJavaScript={`Meteor.loginWithToken('${ token }', function() { })`}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	token: getUserSelector(state).token
});

export default connect(mapStateToProps)(withTheme(AdminPanelView));
