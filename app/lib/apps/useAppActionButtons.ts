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
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import log from '~/lib/methods/helpers/log';
import { getUserSelector } from '~/selectors/login';
import { type TPermissionModel, type TSubscriptionModel } from '~/definitions';
import i18n from '~/i18n';

export interface IAppActionButtonItem {
	id: string;
	label: string;
	button: IAppActionButton;
}

export interface IAppActionButtonFilter {
	context: TUIActionButtonContext;
	/** Leave out to accept every category. */
	category?: TAppActionButtonCategory;
}

interface IRoomContext {
	/** The rid this was resolved for, so a room change can't be filtered against the previous one. */
	rid: string;
	room: IAppActionButtonRoom;
	roles: string[];
}

const splitKey = (key: string): string[] => (key ? key.split(',') : []);

const useRoomContext = (rid?: string, enabled = true): IRoomContext | null => {
	const [roomContext, setRoomContext] = useState<IRoomContext | null>(null);

	useEffect(() => {
		if (!rid || !enabled) {
			return;
		}
		// Observing the query rather than one record picks up a subscription created after mount.
		const subscription = database.active
			.get('subscriptions')
			.query(Q.where('id', rid))
			.observeWithColumns(['roles', 't', 'team_main', 'prid', 'uids'])
			.subscribe({
				next: records => {
					const [sub] = records as TSubscriptionModel[];
					setRoomContext({
						rid,
						room: { t: sub?.t, teamMain: sub?.teamMain, prid: sub?.prid, uids: sub?.uids },
						roles: sub?.roles ?? []
					});
				},
				error: log
			});
		return () => subscription.unsubscribe();
	}, [rid, enabled]);

	return rid && roomContext?.rid === rid ? roomContext : null;
};

const usePermissionRoles = (permissionsKey: string): { [permission: string]: string[] } | null => {
	const [state, setState] = useState<{ key: string; roles: { [permission: string]: string[] } } | null>(null);

	useEffect(() => {
		const ids = splitKey(permissionsKey);
		if (!ids.length) {
			return;
		}
		const subscription = database.active
			.get('permissions')
			.query(Q.where('id', Q.oneOf(ids)))
			.observeWithColumns(['roles'])
			.subscribe({
				next: records => {
					const roles = (records as TPermissionModel[]).reduce<{ [permission: string]: string[] }>((acc, record) => {
						acc[record.id] = record.roles ?? [];
						return acc;
					}, {});
					setState({ key: permissionsKey, roles });
				},
				error: log
			});
		return () => subscription.unsubscribe();
	}, [permissionsKey]);

	if (!permissionsKey) {
		return {};
	}
	return state?.key === permissionsKey ? state.roles : null;
};

/** Returns one list of buttons per filter, in the same order. */
export const useAppActionButtons = ({
	filters,
	rid
}: {
	filters: IAppActionButtonFilter[];
	rid?: string;
}): IAppActionButtonItem[][] => {
	const contextsKey = filters.map(({ context }) => context).join(',');
	const buttons = useAppsStore(
		useShallow(state => {
			const contexts = splitKey(contextsKey);
			return state.actionButtons.filter(button => contexts.includes(button.context));
		})
	);
	const translations = useAppsStore(state => state.translations);
	const userRoles = useAppSelector(state => getUserSelector(state).roles || [], shallowEqual);
	// Re-renders on a language change, so `i18n.locale` below is read fresh.
	useAppSelector(state => getUserSelector(state).language);
	const { locale } = i18n;

	useEffect(subscribeToApps, []);

	const hasButtons = buttons.length > 0;
	const permissionsKey = useMemo(() => collectPermissions(buttons).join(','), [buttons]);
	const roomContext = useRoomContext(rid, hasButtons);
	const permissions = usePermissionRoles(permissionsKey);
	const filtersKey = filters.map(({ context, category }) => `${context}:${category ?? ''}`).join(',');

	return useMemo(() => {
		const parsedFilters = splitKey(filtersKey).map(entry => {
			const [context, category] = entry.split(':');
			return { context, category: (category || undefined) as TAppActionButtonCategory | undefined };
		});
		if (!hasButtons || !permissions || (rid && !roomContext)) {
			return parsedFilters.map(() => []);
		}
		const roles = [...new Set([...(roomContext?.roles ?? []), ...userRoles])];
		const room = roomContext?.room ?? {};
		const visible = buttons.filter(button => applyRoomFilter(button, room) && applyAuthFilter(button, { roles, permissions }));

		return parsedFilters.map(({ context, category }) =>
			visible
				.filter(button => button.context === context && (!category || applyCategoryFilter(button, category)))
				.map(button => ({
					id: getIdForActionButton(button),
					label: translateAppKey({ appId: button.appId, key: button.labelI18n, translations, locale }),
					button
				}))
		);
	}, [buttons, filtersKey, hasButtons, locale, permissions, rid, roomContext, translations, userRoles]);
};
