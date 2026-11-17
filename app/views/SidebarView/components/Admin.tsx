import { memo } from 'react';

import * as List from '~/containers/List';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { useTheme } from '~/theme';
import { sidebarNavigate } from '../methods/sidebarNavigate';

export const useIsAdmin = () =>
	usePermissions(['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting']).some(
		Boolean
	);

export const useAdminRoute = () => (useMasterDetail() ? 'AdminPanelView' : 'AdminPanelStackNavigator');

const Admin = ({ currentScreen }: { currentScreen: string }) => {
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
