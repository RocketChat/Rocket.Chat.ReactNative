import { shallowEqual } from 'react-redux';

import { getPermissionsSelector, useAppSelector, usePermissions } from '../../../lib/hooks';

export const useCanUploadFile = (rid?: string): boolean => {
	const [uploadPermissionRedux] = useAppSelector(state => getPermissionsSelector(state, ['mobile-upload-file']), shallowEqual);
	const [permissionToUpload] = usePermissions(['mobile-upload-file'], rid);

	// Servers older than 4.2
	if (!uploadPermissionRedux) {
		return true;
	}

	return permissionToUpload;
};
