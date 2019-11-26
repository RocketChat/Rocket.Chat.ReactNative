import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { DrawerButton } from '../../containers/HeaderButton';
import styles from '../Styles';
import { themedHeader } from '../../utils/navigation';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';

class AdminPanelView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => ({
		...themedHeader(screenProps.theme),
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Admin_Panel')
	})

	static propTypes = {
		baseUrl: PropTypes.string,
		authToken: PropTypes.string,
		theme: PropTypes.string
	}

	render() {
		const { baseUrl, authToken, theme } = this.props;
		if (!baseUrl) {
			return null;
		}
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]} testID='terms-view'>
				<StatusBar theme={theme} />
				<WebView
					source={{ uri: `${ baseUrl }/admin/info?layout=embedded` }}
					injectedJavaScript={`Meteor.loginWithToken('${ authToken }', function() { })`}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	authToken: state.login.user && state.login.user.token
});

export default connect(mapStateToProps)(withTheme(AdminPanelView));
