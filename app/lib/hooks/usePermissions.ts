import { useState, useEffect, useRef } from 'react';
import { dequal } from 'dequal';
import { Subscription } from 'rxjs';
import { createSelector } from 'reselect';
import { shallowEqual } from 'react-redux';

import { TSupportedPermissions } from '../../reducers/permissions';
import { IApplicationState, TSubscriptionModel } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import database from '../database';
import log from '../../utils/log';
import { useAppSelector } from './useAppSelector';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

type TPermissionState = (boolean | undefined)[];

const getPermissionsSelector = createSelector(
	[(state: IApplicationState) => state.permissions, (_state: any, permissionsArray: TSupportedPermissions[]) => permissionsArray],
	(permissions, permissionsArray) => permissionsArray.map(p => permissions[p])
);

const useSubscription = (rid?: string) => {
	const [subscription, setSubscription] = useState<TSubscriptionModel | null>(null);

	useEffect(() => {
		if (!rid) {
			return;
		}
		console.count('useSubscription fetch');
		let subSubscription: Subscription;
		getSubscriptionByRoomId(rid).then(sub => {
			if (!sub) {
				return;
			}
			setSubscription(sub);

			// const observable = sub.observe();
			// subSubscription = observable.subscribe(s => {
			// 	console.count('useSubscription observable setSub');
			// 	setSubscription(s);
			// });
		});

		return () => {
			subSubscription.unsubscribe();
		};
	}, []); // FIXME: why is lint complaining about this?

	console.count('useSubscription');
	return subscription;
};

export function usePermissions(permissions: TSupportedPermissions[], rid?: string) {
	console.log('🚀 ~ file: usePermissions.ts ~ line 25 ~ usePermissions ~ permissions', permissions);
	const [permissionsState, setPermissionsState] = useState<TPermissionState>(permissions.map(() => false));
	// const [roomRoles, setRoomRoles] = useState<string[]>([]);
	const userRoles = useAppSelector((state: IApplicationState) => getUserSelector(state).roles || [], shallowEqual);
	// const subscription = useRef<Subscription | null>(null);
	const permissionsRedux = useAppSelector(state => getPermissionsSelector(state, permissions), shallowEqual);

	const subscription = useSubscription(rid);
	console.log('🚀 ~ file: usePermissions.ts ~ line 49 ~ usePermissions ~ sub', subscription);

	const _hasPermissions = (perms: (string[] | undefined)[], _rid?: string) => {
		try {
			const mergedRoles = [...new Set([...(subscription?.roles || []), ...userRoles])];
			const result = perms.map(permission => permission?.some(r => mergedRoles.includes(r) ?? false));
			if (!dequal(permissionsState, result)) {
				setPermissionsState(result);
			}
		} catch (e) {
			log(e);
		}
	};

	// const _observeRoom = async (rid: string) => {
	// 	const db = database.active;
	// 	const subsCollection = db.get('subscriptions');
	// 	try {
	// 		// get the room from database
	// 		const room = await subsCollection.find(rid);
	// 		const observable = room.observe();
	// 		subscription.current = observable.subscribe(sub => {
	// 			if (!dequal(sub.roles, roomRoles)) {
	// 				setRoomRoles(sub.roles ?? []);
	// 			}
	// 		});
	// 	} catch (error) {
	// 		console.log('hasPermission -> Room not found');
	// 		setPermissionsState([]);
	// 	}
	// };

	useEffect(() => {
		if (permissionsRedux) {
			console.count('Hooks: usePermissions');
			_hasPermissions(permissionsRedux, rid);
		}
	}, [userRoles, permissionsRedux, subscription?.roles]);

	// useEffect(() => {
	// 	if (rid && !subscription.current) {
	// 		_observeRoom(rid);
	// 	}

	// 	return () => {
	// 		if (subscription.current && subscription.current?.unsubscribe) {
	// 			subscription.current.unsubscribe();
	// 		}
	// 	};
	// }, [subscription.roomRoles]);

	console.log('🚀 ~ file: usePermissions.ts ~ line 86 ~ usePermissions ~ permissionsState', permissionsState);
	return permissionsState;
}
