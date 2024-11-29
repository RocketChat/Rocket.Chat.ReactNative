import { createSelector } from 'reselect';
import { shallowEqual } from 'react-redux';

import { TSupportedPermissions } from '../../reducers/permissions';
import { IApplicationState } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import { useAppSelector } from './useAppSelector';
import { useSubscriptionRoles } from './useSubscriptionRoles';

export const getPermissionsSelector = createSelector(
	[(state: IApplicationState) => state.permissions, (_state: any, permissionsArray: TSupportedPermissions[]) => permissionsArray],
	(permissions, permissionsArray) => permissionsArray.map(p => permissions[p])
);

export function usePermissions(permissions: TSupportedPermissions[], rid?: string): boolean[] {
	const userRoles = useAppSelector(state => getUserSelector(state).roles || [], shallowEqual);
	const permissionsRedux = useAppSelector(state => getPermissionsSelector(state, permissions), shallowEqual);
	const subscriptionRoles = useSubscriptionRoles(rid);

	const mergedRoles = [...new Set([...(subscriptionRoles || []), ...userRoles])];
	return permissionsRedux.map(permission => (permission ?? []).some(r => mergedRoles.includes(r)));
}
