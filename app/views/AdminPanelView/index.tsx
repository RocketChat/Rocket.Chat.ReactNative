import React from 'react';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';
import { DrawerScreenProps } from '@react-navigation/drawer';

import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import * as HeaderButton from '../../containers/HeaderButton';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';

interface IAdminPanelViewProps {
	baseUrl: string;
	token: string;
}

interface INavigationOptions {
	navigation: DrawerScreenProps<any>;
	isMasterDetail: boolean;
}

class AdminPanelView extends React.Component<IAdminPanelViewProps, any> {
	static navigationOptions = ({ navigation, isMasterDetail }: INavigationOptions) => ({
		headerLeft: isMasterDetail ? undefined : () => <HeaderButton.Drawer navigation={navigation} />,
		title: I18n.t('Admin_Panel')
	});

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
					source={{ uri: `${baseUrl}/admin/info?layout=embedded` }}
					injectedJavaScript={`Meteor.loginWithToken('${token}', function() { })`}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	baseUrl: state.server.server,
	token: getUserSelector(state).token
});

export default connect(mapStateToProps)(withTheme(AdminPanelView));
