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
import { getUserSelector } from '../../selectors/login';

class AdminPanelView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => ({
		...themedHeader(screenProps.theme),
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Admin_Panel')
	})

	static propTypes = {
		baseUrl: PropTypes.string,
		token: PropTypes.string,
		theme: PropTypes.string
	}

	render() {
		const { baseUrl, token, theme } = this.props;
		if (!baseUrl) {
			return null;
		}
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]} testID='terms-view'>
				<StatusBar theme={theme} />
				<WebView
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
