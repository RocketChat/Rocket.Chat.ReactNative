import { memo } from 'react';

import * as List from '~/containers/List';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { menuNavigate } from '../methods/menuNavigate';

export const useIsAdmin = () =>
	usePermissions(['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting']).some(
		Boolean
	);

const Admin = () => {
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
				onPress={() => menuNavigate('AdminPanelView')}
			/>
			<List.Separator />
		</>
	);
};

export default memo(Admin);
