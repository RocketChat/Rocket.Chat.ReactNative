import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import I18n from '../../i18n';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { type AdminPanelStackParamList } from '../../stacks/types';
import { type IApplicationState } from '../../definitions';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';

const AdminPanelView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<AdminPanelStackParamList, 'AdminPanelView'>>();
	const baseUrl = useSelector((state: IApplicationState) => state.server.server);
	const token = useSelector((state: IApplicationState) => getUserSelector(state).token);
	const isMasterDetail = useMasterDetail();
	const insets = useSafeAreaInsets();

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
			<WebView
				// https://github.com/react-native-community/react-native-webview/issues/1311
				onMessage={() => {}}
				source={{ uri: `${baseUrl}/admin/info?layout=embedded` }}
				injectedJavaScript={str}
				containerStyle={{ paddingBottom: insets.bottom }}
			/>
		</SafeAreaView>
	);
};

export default AdminPanelView;
