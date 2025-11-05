import { memo, useMemo } from 'react';

import * as List from '../../../containers/List';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { usePermissions } from '../../../lib/hooks/usePermissions';
import { useTheme } from '../../../theme';
import { sidebarNavigate } from '../methods/sidebarNavigate';

const Admin = ({ currentScreen }: { currentScreen: string | null }) => {
	'use memo';

	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const { colors } = useTheme();
	const [
		viewStatisticsPermission,
		viewRoomAdministrationPermission,
		viewUserAdministrationPermission,
		viewPrivilegedSettingPermission
	] = usePermissions(['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting']);

	const isAdmin = useMemo(
		() =>
			[
				viewStatisticsPermission,
				viewRoomAdministrationPermission,
				viewUserAdministrationPermission,
				viewPrivilegedSettingPermission
			].some(permission => permission),
		[
			viewStatisticsPermission,
			viewRoomAdministrationPermission,
			viewUserAdministrationPermission,
			viewPrivilegedSettingPermission
		]
	);

	if (!isAdmin) {
		return null;
	}
	const routeName = isMasterDetail ? 'AdminPanelView' : 'AdminPanelStackNavigator';
	return (
		<>
			<List.Item
				title={'Admin_Panel'}
				left={() => <List.Icon name='settings' />}
				onPress={() => sidebarNavigate(routeName)}
				backgroundColor={currentScreen === routeName ? colors.strokeLight : undefined}
			/>
			<List.Separator />
		</>
	);
};

export default memo(Admin);
