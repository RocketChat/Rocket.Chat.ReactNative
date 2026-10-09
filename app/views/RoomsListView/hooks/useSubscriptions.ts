import { Q } from '@nozbe/watermelondb';
import { useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import type { Subscription } from 'rxjs';

import { type ISidebarCategory, type TSubscriptionModel } from '~/definitions';
import { SortBy } from '~/lib/constants/constantDisplayMode';
import database from '~/lib/database';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';
import { buildRoomList } from './groupRooms';
import { getGroupOrder } from './sidebarGroupOrder';

const CUSTOM_CATEGORIES_LICENSE_MODULE = 'experimental-enterprise-features';
const NO_CATEGORIES: ISidebarCategory[] = [];
const NO_ROWS: TSubscriptionModel[] = [];
const SECTION_BADGE_COLUMNS = ['unread', 'user_mentions', 'group_mentions', 'tunread', 'tunread_user', 'tunread_group'];

export const useSubscriptions = (collapsedGroups: ReadonlySet<string>) => {
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const server = useAppSelector(state => state.server);
	const [loaded, setLoaded] = useState<{ server: typeof server; rows: TSubscriptionModel[] }>();
	const roles = useAppSelector(state => getUserSelector(state).roles, shallowEqual);
	const { sortBy, showUnread, showFavorites, groupByType } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const hasCustomCategoriesLicense = useAppSelector(state => state.enterpriseModules.includes(CUSTOM_CATEGORIES_LICENSE_MODULE));
	const sidebarCategories = useAppSelector(state => getUserSelector(state).sidebarCategories ?? NO_CATEGORIES);
	const categories = hasCustomCategoriesLicense ? sidebarCategories : NO_CATEGORIES;
	const customCategoryNames = useMemo(
		() => new Map(categories.filter(category => !category.default).map(category => [category._id, category.name])),
		[categories]
	);
	const groupOrder = useMemo(() => getGroupOrder(categories), [categories]);
	const isGrouping = showUnread || showFavorites || groupByType;
	const isOmnichannelAgent = roles?.includes('livechat-agent') ?? false;
	const hasCollapsedGroup = collapsedGroups.size > 0;

	useEffect(() => {
		let cancelled = false;
		let subscription: Subscription | undefined;

		const getSubscriptions = async () => {
			const db = database.active;
			const whereClause = [Q.where('archived', false), Q.where('open', true)] as (Q.WhereDescription | Q.SortBy)[];

			if (sortBy === SortBy.Alphabetical) {
				whereClause.push(Q.sortBy(`${useRealName ? 'fname' : 'name'}`, Q.asc));
			} else {
				whereClause.push(Q.sortBy('room_updated_at', Q.desc));
			}

			const observeWithColumns = [
				'on_hold',
				...(isGrouping ? ['alert', 'f', 'category'] : []),
				...(hasCollapsedGroup ? SECTION_BADGE_COLUMNS : [])
			];

			const observable = await db
				.get('subscriptions')
				.query(...whereClause)
				.observeWithColumns(observeWithColumns);

			if (cancelled) {
				return;
			}

			subscription = observable.subscribe(data => {
				setLoaded({ server, rows: data });
			});
		};

		getSubscriptions();

		return () => {
			cancelled = true;
			subscription?.unsubscribe();
		};
	}, [isGrouping, hasCollapsedGroup, sortBy, useRealName, server]);

	const rows = loaded?.rows ?? NO_ROWS;
	const loading = loaded?.server !== server;

	const subscriptions = useMemo(
		() =>
			buildRoomList(rows, {
				groupOrder,
				customCategoryNames,
				showUnread,
				showFavorites,
				groupByType,
				isOmnichannelAgent,
				collapsedGroups
			}),
		[rows, groupOrder, customCategoryNames, showUnread, showFavorites, groupByType, isOmnichannelAgent, collapsedGroups]
	);

	return {
		subscriptions,
		loading
	};
};
