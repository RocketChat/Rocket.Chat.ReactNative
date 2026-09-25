import { memo, useMemo } from 'react';

import * as List from '~/containers/List';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { useTheme } from '~/theme';
import { sidebarNavigate } from '../methods/sidebarNavigate';

export const useIsAdmin = () => {
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

	return isAdmin;
};

export const useAdminRoute = () => (useMasterDetail() ? 'AdminPanelView' : 'AdminPanelStackNavigator');

const Admin = ({ currentScreen }: { currentScreen: string | null }) => {
	const routeName = useAdminRoute();
	const { colors } = useTheme();
	const isAdmin = useIsAdmin();

	if (!isAdmin) {
		return null;
	}
	return (
		<>
			<List.Item
				title={'Admin_Panel'}
				testID='sidebar-admin'
				left={() => <List.Icon name='settings' />}
				onPress={() => sidebarNavigate(routeName)}
				backgroundColor={currentScreen === routeName ? colors.strokeLight : undefined}
			/>
			<List.Separator />
		</>
	);
};

export default memo(Admin);
