import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import LoggedView from '../View';
import StatusBar from '../../containers/StatusBar';
import { DrawerButton } from '../../containers/HeaderButton';
import styles from '../Styles';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	authToken: state.login.user && state.login.user.token
}))
/** @extends React.Component */
export default class AdminPanelView extends LoggedView {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Admin_Panel')
	})

	static propTypes = {
		baseUrl: PropTypes.string,
		authToken: PropTypes.string
	}

	constructor(props) {
		super('AdminPanelView', props);
	}

	render() {
		const { baseUrl, authToken } = this.props;
		if (!baseUrl) {
			return null;
		}
		return (
			<SafeAreaView style={styles.container} testID='terms-view'>
				<StatusBar />
				<WebView
					source={{ uri: `${ baseUrl }/admin/info?layout=embedded` }}
					injectedJavaScript={`Meteor.loginWithToken('${ authToken }', function() { })`}
				/>
			</SafeAreaView>
		);
	}
}
