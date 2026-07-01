import { useState, useEffect, useRef } from 'react';
import { dequal } from 'dequal';
import { type Subscription } from 'rxjs';
import { createSelector } from 'reselect';
import { shallowEqual } from 'react-redux';
import { orderBy } from 'lodash';

import { type TSupportedPermissions } from '../../reducers/permissions';
import { type IApplicationState, type TSubscriptionModel } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import { useAppSelector } from './useAppSelector';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

export const getPermissionsSelector = createSelector(
	[(state: IApplicationState) => state.permissions, (_state: any, permissionsArray: TSupportedPermissions[]) => permissionsArray],
	(permissions, permissionsArray) => permissionsArray.map(p => permissions[p])
);

const EMPTY_ROLES: TSubscriptionModel['roles'] = [];

const useSubscriptionRoles = (rid?: string): TSubscriptionModel['roles'] => {
	const [rolesByRid, setRolesByRid] = useState<{ rid?: string; roles: TSubscriptionModel['roles'] }>({ roles: EMPTY_ROLES });
	const rolesByRidRef = useRef(rolesByRid);

	useEffect(() => {
		if (!rid) {
			return;
		}
		let subSubscription: Subscription;
		getSubscriptionByRoomId(rid).then(sub => {
			if (!sub) {
				return;
			}
			const observable = sub.observe();
			subSubscription = observable.subscribe(s => {
				const newRoles = orderBy(s.roles);
				if (rolesByRidRef.current.rid !== rid || !dequal(rolesByRidRef.current.roles, newRoles)) {
					rolesByRidRef.current = { rid, roles: newRoles };
					setRolesByRid(rolesByRidRef.current);
				}
			});
		});

		return () => {
			if (subSubscription && subSubscription?.unsubscribe) {
				subSubscription.unsubscribe();
			}
		};
	}, [rid]);

	// Ignore roles captured for a previous rid so stale roles never leak after rid changes.
	return rolesByRid.rid === rid ? rolesByRid.roles : EMPTY_ROLES;
};

export function usePermissions(permissions: TSupportedPermissions[], rid?: string): boolean[] {
	const userRoles = useAppSelector(state => getUserSelector(state).roles || [], shallowEqual);
	const permissionsRedux = useAppSelector(state => getPermissionsSelector(state, permissions), shallowEqual);
	const subscriptionRoles = useSubscriptionRoles(rid);

	const mergedRoles = [...new Set([...(subscriptionRoles || []), ...userRoles])];
	return permissionsRedux.map(permission => (permission ?? []).some(r => mergedRoles.includes(r)));
}
