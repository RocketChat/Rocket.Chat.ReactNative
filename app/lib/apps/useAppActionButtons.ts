import { useEffect, useMemo, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { shallowEqual } from 'react-redux';
import { combineLatest, of } from 'rxjs';

import { useAppsStore } from './appsStore';
import {
	getIdForActionButton,
	type IAppActionButton,
	type IAppActionButtonRoom,
	type TAppActionButtonCategory,
	type TUIActionButtonContext
} from './definitions';
import { applyAuthFilter, applyCategoryFilter, applyRoomFilter, collectPermissions } from './filters';
import { translateAppKey } from './translations';
import database from '~/lib/database';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import log from '~/lib/methods/helpers/log';
import { getUserSelector } from '~/selectors/login';
import { type TPermissionModel, type TSubscriptionModel } from '~/definitions';

interface IAppActionButtonContext {
	rid?: string;
	permissionKey: string;
	room: IAppActionButtonRoom;
	roomRoles: string[];
	permissions: { [permission: string]: string[] };
}

export interface IAppActionButtonItem {
	id: string;
	label: string;
	button: IAppActionButton;
}

export const selectAppActionButtons = (
	items: IAppActionButtonItem[],
	context: TUIActionButtonContext,
	category: TAppActionButtonCategory = 'default'
): IAppActionButtonItem[] => items.filter(({ button }) => button.context === context && applyCategoryFilter(button, category));

export const useAppActionButtons = (rid?: string): IAppActionButtonItem[] => {
	const buttons = useAppsStore(state => state.actionButtons);
	const translations = useAppsStore(state => state.translations);
	const userRoles = useAppSelector(state => getUserSelector(state).roles || [], shallowEqual);

	const [filterContext, setContext] = useState<IAppActionButtonContext | null>(null);

	const permissionKey = collectPermissions(buttons).join(',');
	const hasButtons = buttons.length > 0;

	useEffect(() => {
		if (!hasButtons) {
			return;
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

		const subscription = combineLatest([subscription$, permissions$]).subscribe({
			next: ([subscriptions, permissionRecords]) => {
				const [sub] = subscriptions as TSubscriptionModel[];
				setContext({
					rid,
					permissionKey,
					room: { t: sub?.t, teamMain: sub?.teamMain, prid: sub?.prid, uids: sub?.uids },
					roomRoles: sub?.roles ?? [],
					permissions: (permissionRecords as TPermissionModel[]).reduce<{ [permission: string]: string[] }>((acc, record) => {
						acc[record.id] = record.roles ?? [];
						return acc;
					}, {})
				});
			},
			error: log
		});

		return () => subscription.unsubscribe();
	}, [hasButtons, rid, permissionKey]);

	return useMemo(() => {
		if (!filterContext || filterContext.rid !== rid || filterContext.permissionKey !== permissionKey) {
			return [];
		}
		const { room, roomRoles, permissions } = filterContext;
		const roles = [...new Set([...roomRoles, ...userRoles])];
		return buttons
			.filter(button => applyRoomFilter(button, room) && applyAuthFilter(button, { roles, permissions }))
			.map(button => ({
				id: getIdForActionButton(button),
				label: translateAppKey({ appId: button.appId, key: button.labelI18n, translations }),
				button
			}));
	}, [buttons, filterContext, permissionKey, rid, translations, userRoles]);
};
