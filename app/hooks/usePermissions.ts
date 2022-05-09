import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { dequal } from 'dequal';

import { TSupportedPermissions } from '../reducers/permissions';
import { IApplicationState } from '../definitions';
import { getUserSelector } from '../selectors/login';
import { hasPermission } from '../lib/methods';

function usePermissions(permissions: TSupportedPermissions[], rid?: string) {
	const [permissionsState, setPermissionsState] = useState<boolean[]>([]);

	const permissionsRedux = useSelector(
		(state: IApplicationState) => state.permissions,
		(nextState, previousState) => {
			const someDifferent = permissions.some(key => !dequal(nextState?.[key], previousState?.[key]));
			// The equality function is expecting return false when we want to re-render and true when we don't want to re-render
			if (someDifferent) {
				return false;
			}
			return true;
		}
	);

	const userRoles = useSelector((state: IApplicationState) => getUserSelector(state).roles);

	console.count('usePermissions');

	const _hasPermissions = async (perms: (string[] | undefined)[], _rid?: string) => {
		const result = await hasPermission(perms, _rid);
		setPermissionsState(result);
	};

	useEffect(() => {
		if (permissionsRedux) {
			const array: (string[] | undefined)[] = [];
			permissions.forEach(p => array.push(permissionsRedux[p]));
			_hasPermissions(array, rid);
		}
	}, [userRoles, permissionsRedux]);

	return permissionsState;
}

export default usePermissions;
