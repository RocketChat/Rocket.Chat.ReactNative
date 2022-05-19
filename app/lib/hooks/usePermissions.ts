import { useState, useEffect, useRef } from 'react';
import { dequal } from 'dequal';
import { Subscription } from 'rxjs';
import { createSelector } from 'reselect';
import { shallowEqual } from 'react-redux';

import { TSupportedPermissions } from '../../reducers/permissions';
import { IApplicationState, TSubscriptionModel } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import { useAppSelector } from './useAppSelector';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

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

			const observable = sub.observe();
			subSubscription = observable.subscribe(s => {
				console.count('useSubscription observable setSub');
				setSubscription(s);
			});
		});

		return () => {
			subSubscription.unsubscribe();
		};
	}, []); // FIXME: why is lint complaining about this?

	console.count('useSubscription');
	return subscription;
};

export function usePermissions(permissions: TSupportedPermissions[], rid?: string) {
	const userRoles = useAppSelector((state: IApplicationState) => getUserSelector(state).roles || [], shallowEqual);
	const permissionsRedux = useAppSelector(state => getPermissionsSelector(state, permissions), shallowEqual);
	const subscription = useSubscription(rid);

	const mergedRoles = [...new Set([...(subscription?.roles || []), ...userRoles])];
	return permissionsRedux.map(permission => permission?.some(r => mergedRoles.includes(r) ?? false));
}
