import { Q } from '@nozbe/watermelondb';
import { useEffect, useMemo, useRef, useState } from 'react';
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

export const useSubscriptions = () => {
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const server = useAppSelector(state => state.server);
	const subscriptionRef = useRef<Subscription>(null);
	const [subscriptions, setSubscriptions] = useState<TSubscriptionModel[]>([]);
	const [loading, setLoading] = useState(true);
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
	const hasCustomCategories = customCategoryNames.size > 0;
	const isGrouping = showUnread || showFavorites || groupByType || hasCustomCategories;
	const isOmnichannelAgent = roles?.includes('livechat-agent') ?? false;

	useEffect(() => {
		const getSubscriptions = async () => {
			setLoading(true);
			const db = database.active;
			const whereClause = [Q.where('archived', false), Q.where('open', true)] as (Q.WhereDescription | Q.SortBy)[];

			if (sortBy === SortBy.Alphabetical) {
				whereClause.push(Q.sortBy(`${useRealName ? 'fname' : 'name'}`, Q.asc));
			} else {
				whereClause.push(Q.sortBy('room_updated_at', Q.desc));
			}

			const observeWithColumns = isGrouping ? ['alert', 'on_hold', 'f', 'category'] : ['on_hold'];

			const observable = await db
				.get('subscriptions')
				.query(...whereClause)
				.observeWithColumns(observeWithColumns);

			subscriptionRef.current = observable.subscribe(data => {
				setSubscriptions(
					buildRoomList(data, {
						groupOrder,
						customCategoryNames,
						showUnread,
						showFavorites,
						groupByType,
						isOmnichannelAgent
					})
				);
				setLoading(false);
			});
		};

		getSubscriptions();

		return () => {
			subscriptionRef.current?.unsubscribe();
		};
	}, [
		isGrouping,
		sortBy,
		useRealName,
		showUnread,
		showFavorites,
		groupByType,
		isOmnichannelAgent,
		server,
		customCategoryNames,
		hasCustomCategories,
		groupOrder
	]);

	return {
		subscriptions,
		loading
	};
};
