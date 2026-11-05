import { useMemo } from 'react';
import { Q } from '@nozbe/watermelondb';
import { shallowEqual } from 'react-redux';
import { combineLatest, EMPTY, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { useAppsStore } from './appsStore';
import { getIdForActionButton, type IAppActionButton, type IAppActionButtonRoom } from './definitions';
import { applyAuthFilter, applyRoomFilter, collectPermissions, type IAppActionButtonAuth } from './filters';
import { translateAppKey } from './translations';
import database from '~/lib/database';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useObservable } from '~/lib/hooks/useObservable';
import log from '~/lib/methods/helpers/log';
import { getUserSelector } from '~/selectors/login';
import { type TPermissionModel, type TSubscriptionModel } from '~/definitions';

type TAppActionButtonContext = { room?: IAppActionButtonRoom } & Omit<IAppActionButtonAuth, 'userRoles'>;

export interface IAppActionButtonItem {
	id: string;
	label: string;
	button: IAppActionButton;
}

export const useAppActionButtons = (rid?: string): IAppActionButtonItem[] => {
	const buttons = useAppsStore(state => state.actionButtons);
	const translations = useAppsStore(state => state.translations);
	const userRoles = useAppSelector(state => getUserSelector(state).roles || [], shallowEqual);
	const language = useAppSelector(state => getUserSelector(state).language);

	const permissionKey = collectPermissions(buttons).join(',');
	const hasButtons = buttons.length > 0;

	const context$ = useMemo(() => {
		if (!hasButtons) {
			return undefined;
		}

		const db = database.active;
		const permissionIds = permissionKey ? permissionKey.split(',') : [];
		const subscription$ = rid
			? db.get('subscriptions').query(Q.where('id', rid)).observeWithColumns(['t', 'roles', 'team_main', 'prid', 'uids'])
			: of([]);
		const permissions$ = permissionIds.length
			? db
					.get('permissions')
					.query(Q.where('id', Q.oneOf(permissionIds)))
					.observeWithColumns(['roles'])
			: of([]);

		return combineLatest([subscription$, permissions$]).pipe(
			map(([subscriptions, permissionRecords]): TAppActionButtonContext => {
				const [sub] = subscriptions as TSubscriptionModel[];
				return {
					room: rid ? (sub ?? {}) : undefined,
					roomRoles: sub?.roles ?? [],
					permissions: (permissionRecords as TPermissionModel[]).reduce<{ [permission: string]: string[] }>((acc, record) => {
						acc[record.id] = record.roles ?? [];
						return acc;
					}, {})
				};
			}),
			catchError(e => {
				log(e);
				return EMPTY;
			})
		);
	}, [hasButtons, rid, permissionKey]);
	const filterContext = useObservable(context$);

	return useMemo(() => {
		if (!filterContext) {
			return [];
		}
		const { room, roomRoles, permissions } = filterContext;
		return buttons
			.filter(
				button => (!room || applyRoomFilter(button, room)) && applyAuthFilter(button, { userRoles, roomRoles, permissions })
			)
			.map(button => ({
				id: getIdForActionButton(button),
				label: translateAppKey({ appId: button.appId, key: button.labelI18n, translations, locale: language }),
				button
			}));
	}, [buttons, filterContext, translations, userRoles, language]);
};
