import { Q } from '@nozbe/watermelondb';
import { useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import type { Subscription } from 'rxjs';

import { type ISidebarCategory, type TSubscriptionModel } from '~/definitions';
import { SortBy } from '~/lib/constants/constantDisplayMode';
import database from '~/lib/database';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';
import { addRoomsGroup, groupRooms } from './groupRooms';
import { getGroupOrder } from './sidebarGroupOrder';

const UNREAD_HEADER = 'Unread';
const OMNICHANNEL_HEADER_IN_PROGRESS = 'Open_Livechats';
const OMNICHANNEL_HEADER_ON_HOLD = 'On_hold_Livechats';
const CUSTOM_CATEGORIES_LICENSE_MODULE = 'experimental-enterprise-features';
const NO_CATEGORIES: ISidebarCategory[] = [];

const filterIsUnread = (s: TSubscriptionModel) => (s.alert || s.unread) && !s.hideUnreadStatus;
const filterIsOmnichannel = (s: TSubscriptionModel) => s.t === 'l';

export const useSubscriptions = () => {
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const server = useAppSelector(state => state.server);
	const subscriptionRef = useRef<Subscription>(null);
	const [subscriptions, setSubscriptions] = useState<TSubscriptionModel[]>([]);
	const [loading, setLoading] = useState(true);
	const roles = useAppSelector(state => getUserSelector(state).roles, shallowEqual);
	const { sortBy, showUnread, showFavorites, groupByType } = useAppSelector(state => state.sortPreferences, shallowEqual);
	const hasCustomCategoriesLicense = useAppSelector(state => state.enterpriseModules.includes(CUSTOM_CATEGORIES_LICENSE_MODULE));
	const sidebarCategories = useAppSelector(state => {
		const { sidebarCategories: userCategories } = getUserSelector(state);
		return Array.isArray(userCategories) ? userCategories : NO_CATEGORIES;
	});
	const categories = hasCustomCategoriesLicense ? sidebarCategories : NO_CATEGORIES;
	const customCategoryNames = useMemo(
		() => new Map(categories.filter(category => !category.default).map(category => [category._id, category.name])),
		[categories]
	);
	const groupOrder = useMemo(() => getGroupOrder(categories), [categories]);
	const hasCustomCategories = customCategoryNames.size > 0;
	const isGrouping = showUnread || showFavorites || groupByType || hasCustomCategories;

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
				let tempChats = [] as TSubscriptionModel[];
				let chats = data;

				// let omnichannelsUpdate: string[] = [];
				const isOmnichannelAgent = roles?.includes('livechat-agent');
				if (isOmnichannelAgent) {
					const omnichannel = chats.filter(s => filterIsOmnichannel(s));
					const omnichannelInProgress = omnichannel.filter(s => !s.onHold);
					const omnichannelOnHold = omnichannel.filter(s => s.onHold);
					chats = chats.filter(s => !filterIsOmnichannel(s));
					// omnichannelsUpdate = omnichannelInProgress.map(s => s.rid);
					tempChats = addRoomsGroup(omnichannelInProgress, OMNICHANNEL_HEADER_IN_PROGRESS, tempChats);
					tempChats = addRoomsGroup(omnichannelOnHold, OMNICHANNEL_HEADER_ON_HOLD, tempChats);
				}

				// unread
				if (showUnread) {
					const unread = chats.filter(s => filterIsUnread(s));
					chats = chats.filter(s => !filterIsUnread(s));
					tempChats = addRoomsGroup(unread, UNREAD_HEADER, tempChats);
				}

				const hasChatsHeader = showUnread || showFavorites || isOmnichannelAgent || hasCustomCategories;
				tempChats = tempChats.concat(
					groupRooms(chats, { groupOrder, customCategoryNames, showFavorites, groupByType, hasChatsHeader })
				);

				// const chatsUpdate = tempChats.map(item => item.rid);

				setSubscriptions(tempChats);
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
		roles,
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
