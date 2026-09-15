import { DrawerActions, useNavigation } from '@react-navigation/native';
import { headerItems } from '~/lib/methods/helpers/navigation';
import { useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { withKeyboardFocus } from 'react-native-external-keyboard';
import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import I18n from '~/i18n';
import { getUserSelector } from '~/selectors/login';
import SafeAreaView from '~/containers/SafeAreaView';
import { type AdminPanelStackParamList } from '~/stacks/types';
import { type IApplicationState } from '~/definitions';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { buildLoginScript } from './buildLoginScript';

const DrawerItem = withKeyboardFocus(HeaderButton.Item);

const AdminPanelView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<AdminPanelStackParamList, 'AdminPanelView'>>();
	const baseUrl = useSelector((state: IApplicationState) => state.server.server);
	const token = useSelector((state: IApplicationState) => getUserSelector(state).token);
	const isMasterDetail = useMasterDetail();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		navigation.setOptions({
			...headerItems({
				left: isMasterDetail
					? undefined
					: [
							{
								type: 'button',
								label: I18n.t('Menu'),
								iconName: 'hamburguer',
								androidElement: (
									<DrawerItem
										autoFocus
										iconName='hamburguer'
										accessibilityLabel={I18n.t('Menu')}
										onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
									/>
								),
								onPress: () => navigation.dispatch(DrawerActions.toggleDrawer())
							}
						]
			}),
			title: I18n.t('Admin_Panel')
		});
	}, [isMasterDetail, navigation]);

	if (!baseUrl) {
		return null;
	}

	const str = buildLoginScript(token);

	return (
		<SafeAreaView testID='admin-panel-view'>
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
