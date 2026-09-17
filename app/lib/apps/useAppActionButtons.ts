import { useEffect, useMemo, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { shallowEqual } from 'react-redux';
import { useShallow } from 'zustand/react/shallow';

import { subscribeToApps, useAppsStore } from './appsStore';
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
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import log from '~/lib/methods/helpers/log';
import { getUserSelector } from '~/selectors/login';
import { type TPermissionModel } from '~/definitions';

const getPermissionRoles = async (ids: string[]): Promise<{ [permission: string]: string[] }> => {
	if (!ids.length) {
		return {};
	}
	try {
		const records = (await database.active
			.get('permissions')
			.query(Q.where('id', Q.oneOf(ids)))
			.fetch()) as TPermissionModel[];
		return records.reduce<{ [permission: string]: string[] }>((acc, record) => {
			acc[record.id] = record.roles ?? [];
			return acc;
		}, {});
	} catch (e) {
		log(e);
		return {};
	}
};

const splitKey = (key: string): string[] => (key ? key.split(',') : []);

interface IAppActionButtonContext {
	room: IAppActionButtonRoom;
	roles: string[];
	permissions: { [permission: string]: string[] };
}

export interface IAppActionButtonItem {
	id: string;
	label: string;
	button: IAppActionButton;
}

export const useAppActionButtons = ({
	context,
	category = 'default',
	rid
}: {
	context: TUIActionButtonContext;
	category?: TAppActionButtonCategory;
	rid?: string;
}): IAppActionButtonItem[] => {
	const buttons = useAppsStore(useShallow(state => state.actionButtons.filter(button => button.context === context)));
	const translations = useAppsStore(state => state.translations);
	const userRoles = useAppSelector(state => getUserSelector(state).roles || [], shallowEqual);

	const [filterContext, setContext] = useState<IAppActionButtonContext | null>(null);

	useEffect(subscribeToApps, []);

	const permissionIds = useMemo(() => collectPermissions(buttons), [buttons]);
	const permissionsKey = permissionIds.join(',');
	const userRolesKey = userRoles.join(',');
	const hasButtons = buttons.length > 0;

	useEffect(() => {
		if (!hasButtons) {
			return;
		}

		let cancelled = false;

		const resolve = async (): Promise<void> => {
			const subscription = rid ? await getSubscriptionByRoomId(rid) : null;
			const permissionRoles = await getPermissionRoles(splitKey(permissionsKey));
			if (cancelled) {
				return;
			}
			setContext({
				room: {
					t: subscription?.t,
					teamMain: subscription?.teamMain,
					prid: subscription?.prid,
					uids: subscription?.uids
				},
				roles: [...new Set([...(subscription?.roles ?? []), ...splitKey(userRolesKey)])],
				permissions: permissionRoles
			});
		};

		resolve().catch(log);

		return () => {
			cancelled = true;
		};
	}, [hasButtons, rid, permissionsKey, userRolesKey]);

	return useMemo(() => {
		if (!filterContext) {
			return [];
		}
		const { room, roles, permissions } = filterContext;
		return buttons
			.filter(
				button =>
					applyCategoryFilter(button, category) &&
					applyRoomFilter(button, room) &&
					applyAuthFilter(button, { roles, permissions })
			)
			.map(button => ({
				id: getIdForActionButton(button),
				label: translateAppKey({ appId: button.appId, key: button.labelI18n, translations }),
				button
			}));
	}, [buttons, category, filterContext, translations]);
};
