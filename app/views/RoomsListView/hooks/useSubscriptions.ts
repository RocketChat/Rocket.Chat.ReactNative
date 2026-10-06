import { Q } from '@nozbe/watermelondb';
import { useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import type { Subscription } from 'rxjs';

import { type TSubscriptionModel } from '~/definitions';
import { SortBy } from '~/lib/constants/constantDisplayMode';
import database from '~/lib/database';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';
import { buildRoomList } from '../utils/groupRooms';
import { useSidebarCategories } from './useSidebarCategories';

const SECTION_BADGE_COLUMNS = [
	'unread',
	'hide_unread_status',
	'user_mentions',
	'group_mentions',
	'tunread',
	'tunread_user',
	'tunread_group'
];

export const useSubscriptions = (collapsedGroups: ReadonlySet<string>) => {
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const server = useAppSelector(state => state.server);
	const [rows, setRows] = useState<TSubscriptionModel[]>([]);
	const [loading, setLoading] = useState(true);
	const roles = useAppSelector(state => getUserSelector(state).roles, shallowEqual);
	const { sortBy, showUnread, showFavorites, groupByType } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const { customCategoryNames, categoryUnreadOptions, sectionsOrder, groupOrder } = useSidebarCategories();
	const hasCustomCategories = customCategoryNames.size > 0;
	const isGrouping = showUnread || showFavorites || groupByType || hasCustomCategories;
	const isOmnichannelAgent = roles?.includes('livechat-agent') ?? false;

	useEffect(() => {
		let cancelled = false;
		let subscription: Subscription | undefined;

		const getSubscriptions = async () => {
			setLoading(true);
			const db = database.active;
			const whereClause = [Q.where('archived', false), Q.where('open', true)] as (Q.WhereDescription | Q.SortBy)[];

			if (sortBy === SortBy.Alphabetical) {
				whereClause.push(Q.sortBy(`${useRealName ? 'fname' : 'name'}`, Q.asc));
			} else {
				whereClause.push(Q.sortBy('room_updated_at', Q.desc));
			}

			const observeWithColumns = isGrouping ? ['alert', 'on_hold', 'f', 'category', ...SECTION_BADGE_COLUMNS] : ['on_hold'];

			const observable = await db
				.get('subscriptions')
				.query(...whereClause)
				.observeWithColumns(observeWithColumns);

			if (cancelled) {
				return;
			}

			subscription = observable.subscribe(data => {
				setRows(data);
				setLoading(false);
			});
		};

		getSubscriptions();

		return () => {
			cancelled = true;
			subscription?.unsubscribe();
		};
	}, [isGrouping, sortBy, useRealName, server]);

	const subscriptions = useMemo(
		() =>
			buildRoomList(rows, {
				groupOrder,
				customCategoryNames,
				categoryUnreadOptions,
				sectionsOrder,
				showUnread,
				showFavorites,
				groupByType,
				isOmnichannelAgent,
				collapsedGroups
			}),
		[
			rows,
			groupOrder,
			customCategoryNames,
			categoryUnreadOptions,
			sectionsOrder,
			showUnread,
			showFavorites,
			groupByType,
			isOmnichannelAgent,
			collapsedGroups
		]
	);

	return {
		subscriptions,
		loading
	};
};
