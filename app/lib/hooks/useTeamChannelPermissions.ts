import { useSelector } from 'react-redux';

import { type IApplicationState } from '~/definitions';
import { usePermissions } from './usePermissions';
import { compareServerVersion } from '../methods/helpers';
import { type TSupportedPermissions } from '~/reducers/permissions';

const getCreatePermissions = (t: string | undefined, isV7: boolean): TSupportedPermissions[] => {
	if (t === 'p') {
		return isV7 ? ['create-p', 'create-team-group'] : ['create-p'];
	}
	return isV7 ? ['create-c', 'create-team-channel'] : ['create-c'];
};

export const useTeamChannelPermissions = (rid: string | undefined, t: string | undefined) => {
	const serverVersion = useSelector((state: IApplicationState) => state.server.version);
	const isV7 = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0');
	const addExistingPermission: TSupportedPermissions = isV7 ? 'move-room-to-team' : 'add-team-channel';

	const [canAddExisting, ...canCreate] = usePermissions([addExistingPermission, ...getCreatePermissions(t, isV7)], rid);
	return { canCreateNew: canCreate.some(Boolean), canAddExisting };
};
