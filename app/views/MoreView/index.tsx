import React, { memo, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import i18n from '../../i18n';
import { usePermissions } from '../../lib/hooks/usePermissions';

const MoreView = memo(function MoreView() {
	'use memo';

	const navigation = useNavigation<any>();
	const [viewRoomAdministrationPermission, viewStatisticsPermission, viewPrivilegedSettingPermission] = usePermissions([
		'view-room-administration',
		'view-statistics',
		'view-privileged-setting'
	]);
	const showAdmin = viewRoomAdministrationPermission || viewStatisticsPermission || viewPrivilegedSettingPermission;

	const navigateTo = useCallback(
		(screen: string) => {
			navigation.navigate(screen);
		},
		[navigation]
	);

	return (
		<SafeAreaView testID='more-view'>
			<ScrollView>
				<List.Container>
					<List.Item
						title={i18n.t('Profile')}
						left={() => <List.Icon name='user' />}
						onPress={() => navigateTo('ProfileView')}
						testID='more-view-profile'
					/>
					<List.Separator />
					<List.Item
						title={i18n.t('Accessibility_and_Appearance')}
						left={() => <List.Icon name='accessibility' />}
						onPress={() => navigateTo('AccessibilityAndAppearanceView')}
						testID='more-view-accessibility'
					/>
					<List.Separator />
					<List.Item
						title={i18n.t('Settings')}
						left={() => <List.Icon name='administration' />}
						onPress={() => navigateTo('SettingsView')}
						testID='more-view-settings'
					/>
					<List.Separator />
					{showAdmin ? (
						<>
							<List.Item
								title={i18n.t('Admin_Panel')}
								left={() => <List.Icon name='shield-check' />}
								onPress={() => navigateTo('AdminPanelView')}
								testID='more-view-admin'
							/>
							<List.Separator />
						</>
					) : null}
				</List.Container>
			</ScrollView>
		</SafeAreaView>
	);
});

export default MoreView;
