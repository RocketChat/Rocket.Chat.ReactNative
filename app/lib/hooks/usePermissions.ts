import { useState, useEffect, useRef } from 'react';
import { dequal } from 'dequal';
import { Subscription } from 'rxjs';
import { createSelector } from 'reselect';
import { shallowEqual } from 'react-redux';

import { TSupportedPermissions } from '../../reducers/permissions';
import { IApplicationState } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import database from '../database';
import log from '../../utils/log';
import { useAppSelector } from './useAppSelector';

type TPermissionState = (boolean | undefined)[];

const getPermissionsSelector = createSelector(
	[(state: IApplicationState) => state.permissions, (_state: any, permissionsArray: TSupportedPermissions[]) => permissionsArray],
	(permissions, permissionsArray) =>
		Object.keys(permissions)
			.filter(key => permissionsArray.includes(key))
			.reduce((obj: any, key) => {
				obj[key] = permissions[key];
				return obj;
			}, {})
);

export function usePermissions(permissions: TSupportedPermissions[], rid?: string) {
	const [permissionsState, setPermissionsState] = useState<TPermissionState>([]);
	const [roomRoles, setRoomRoles] = useState<string[]>([]);
	const subscription = useRef<Subscription | null>(null);

	const permissionsRedux = useAppSelector(state => getPermissionsSelector(state, permissions), shallowEqual);

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
