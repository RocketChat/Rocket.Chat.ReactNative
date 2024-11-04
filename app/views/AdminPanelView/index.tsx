import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import * as HeaderButton from '../../containers/HeaderButton';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { AdminPanelStackParamList } from '../../stacks/types';
import { IApplicationState } from '../../definitions';

const AdminPanelView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<AdminPanelStackParamList, 'AdminPanelView'>>();
	const baseUrl = useSelector((state: IApplicationState) => state.server.server);
	const token = useSelector((state: IApplicationState) => getUserSelector(state).token);
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);

	useEffect(() => {
		navigation.setOptions({
			headerLeft: isMasterDetail ? undefined : () => <HeaderButton.Drawer navigation={navigation} />,
			title: I18n.t('Admin_Panel')
		});
	}, [isMasterDetail, navigation]);

	if (!baseUrl) {
		return null;
	}

	const str = `Meteor.loginWithToken('${token}', function() { })`;

	return (
		<SafeAreaView>
			<StatusBar />
			<WebView
				// https://github.com/react-native-community/react-native-webview/issues/1311
				onMessage={() => {}}
				source={{ uri: `${baseUrl}/admin/info?layout=embedded` }}
				injectedJavaScript={str}
			/>
		</SafeAreaView>
	);
};

export default AdminPanelView;
