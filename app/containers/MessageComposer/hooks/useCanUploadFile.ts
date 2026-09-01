import { shallowEqual } from 'react-redux';

import { usePermissions, getPermissionsSelector } from '../../../lib/hooks/usePermissions';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';

export const useCanUploadFile = (rid?: string): boolean => {
	const [uploadPermissionRedux] = useAppSelector(state => getPermissionsSelector(state, ['mobile-upload-file']), shallowEqual);
	const [permissionToUpload] = usePermissions(['mobile-upload-file'], rid);

	// Servers older than 4.2
	if (!uploadPermissionRedux) {
		return true;
	}

	return permissionToUpload;
};
