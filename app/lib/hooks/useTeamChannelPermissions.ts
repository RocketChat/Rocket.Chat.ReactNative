import { useSelector } from 'react-redux';

import { type IApplicationState } from '../../definitions';
import { usePermissions } from './usePermissions';
import { compareServerVersion } from '../methods/helpers';
import { type TSupportedPermissions } from '../../reducers/permissions';

export const useCreateNewPermission = (rid: string, t: 'c' | 'p') => {
	const permissions: TSupportedPermissions[] = t === 'c' ? ['create-c'] : ['create-p'];

	const serverVersion = useSelector((state: IApplicationState) => state.server.version);
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
		permissions.push(t === 'c' ? 'create-team-channel' : 'create-team-group');
	}

	const result = usePermissions(permissions, rid);
	return result.some(Boolean);
};

export const useAddExistingPermission = (rid: string) => {
	let permissions: TSupportedPermissions[] = ['add-team-channel'];

	const serverVersion = useSelector((state: IApplicationState) => state.server.version);
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
		permissions = ['move-room-to-team'];
	}

	const result = usePermissions(permissions, rid);
	return result[0];
};

export const useCanCreateTeamChannel = (rid: string, t: 'c' | 'p') => {
	const canCreateNew = useCreateNewPermission(rid, t);
	const canAddExisting = useAddExistingPermission(rid);
	return canCreateNew || canAddExisting;
};
