import { useState, useEffect, useRef } from 'react';
import { dequal } from 'dequal';
import { Subscription } from 'rxjs';

import { TSupportedPermissions } from '../../reducers/permissions';
import { IApplicationState } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import database from '../database';
import log from '../../utils/log';
import { useAppSelector } from './useAppSelector';

type TPermissionState = (boolean | undefined)[];

export function usePermissions(permissions: TSupportedPermissions[], rid?: string) {
	const [permissionsState, setPermissionsState] = useState<TPermissionState>([]);
	const [roomRoles, setRoomRoles] = useState<string[]>([]);
	const subscription = useRef<Subscription | null>(null);

	const permissionsRedux = useAppSelector(
		state => state.permissions,
		(nextState, previousState) => {
			const someDifferent = permissions.some(key => !dequal(nextState?.[key], previousState?.[key]));
			// The equality function is expecting return false when we want to re-render and true when we don't want to re-render
			if (someDifferent) {
				return false;
			}
			return true;
		}
	);

	const userRoles = useAppSelector((state: IApplicationState) => getUserSelector(state).roles);

	const _hasPermissions = (perms: (string[] | undefined)[], _rid?: string) => {
		try {
			const userRolesTmp = userRoles || [];
			const mergedRoles = [...new Set([...roomRoles, ...userRolesTmp])];
			const result = perms.map(permission => permission?.some(r => mergedRoles.includes(r) ?? false));
			setPermissionsState(result);
		} catch (e) {
			log(e);
		}
	};

	const _observeRoom = async (rid: string) => {
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		try {
			// get the room from database
			const room = await subsCollection.find(rid);
			const observable = room.observe();
			subscription.current = observable.subscribe(sub => {
				if (!dequal(sub.roles, roomRoles)) {
					setRoomRoles(sub.roles ?? []);
				}
			});
		} catch (error) {
			console.log('hasPermission -> Room not found');
			setPermissionsState([]);
		}
	};

	useEffect(() => {
		if (permissionsRedux) {
			console.count('Hooks: usePermissions');
			const array: (string[] | undefined)[] = [];
			permissions.forEach(p => array.push(permissionsRedux[p]));
			_hasPermissions(array, rid);
		}
	}, [userRoles, permissionsRedux, roomRoles]);

	useEffect(() => {
		if (rid && !subscription.current) {
			_observeRoom(rid);
		}

		return () => {
			if (subscription.current && subscription.current?.unsubscribe) {
				subscription.current.unsubscribe();
			}
		};
	}, [roomRoles]);

	return permissionsState;
}
