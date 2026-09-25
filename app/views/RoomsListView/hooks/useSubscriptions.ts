import { Q } from '@nozbe/watermelondb';
import { useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import type { Subscription } from 'rxjs';

import { type ISidebarCategory, type TSubscriptionModel } from '~/definitions';
import { SortBy } from '~/lib/constants/constantDisplayMode';
import database from '~/lib/database';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';
import {
	CHANNELS_GROUP,
	CONVERSATIONS_GROUP,
	DIRECT_MESSAGES_GROUP,
	DISCUSSIONS_GROUP,
	FAVORITES_GROUP,
	getGroupOrder,
	TEAMS_GROUP
} from './sidebarGroupOrder';

const CHATS_HEADER = 'Chats';
const UNREAD_HEADER = 'Unread';
const OMNICHANNEL_HEADER_IN_PROGRESS = 'Open_Livechats';
const OMNICHANNEL_HEADER_ON_HOLD = 'On_hold_Livechats';
const CUSTOM_CATEGORIES_LICENSE_MODULE = 'experimental-enterprise-features';
const NO_CATEGORIES: ISidebarCategory[] = [];

const filterIsUnread = (s: TSubscriptionModel) => (s.alert || s.unread) && !s.hideUnreadStatus;
const filterIsOmnichannel = (s: TSubscriptionModel) => s.t === 'l';

const getRoomGroup = (subscription: TSubscriptionModel, groups: Map<string, TSubscriptionModel[]>) => {
	if (subscription.category && groups.has(subscription.category)) {
		return subscription.category;
	}
	if (subscription.f && groups.has(FAVORITES_GROUP)) {
		return FAVORITES_GROUP;
	}
	if (subscription.teamMain && groups.has(TEAMS_GROUP)) {
		return TEAMS_GROUP;
	}
	if (subscription.prid && groups.has(DISCUSSIONS_GROUP)) {
		return DISCUSSIONS_GROUP;
	}
	if ((subscription.t === 'c' || subscription.t === 'p') && groups.has(CHANNELS_GROUP)) {
		return CHANNELS_GROUP;
	}
	if (subscription.t === 'd' && groups.has(DIRECT_MESSAGES_GROUP)) {
		return DIRECT_MESSAGES_GROUP;
	}
	if (groups.has(CONVERSATIONS_GROUP)) {
		return CONVERSATIONS_GROUP;
	}
	return undefined;
};

const addRoomsGroup = (data: TSubscriptionModel[], header: string, allData: TSubscriptionModel[], title?: string) => {
	if (data.length > 0) {
		if (header) {
			allData.push({ rid: header, separator: true, name: title } as TSubscriptionModel);
		}
		allData = allData.concat(data);
	}
	return allData;
};

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
	const customCategories = useMemo(() => categories.filter(category => !category.default), [categories]);
	const groupOrder = useMemo(() => getGroupOrder(categories), [categories]);
	const hasCustomCategories = customCategories.length > 0;
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

				const isVisibleGroup = (key: string) => {
					switch (key) {
						case FAVORITES_GROUP:
							return showFavorites;
						case TEAMS_GROUP:
						case DISCUSSIONS_GROUP:
						case CHANNELS_GROUP:
						case DIRECT_MESSAGES_GROUP:
							return groupByType;
						case CONVERSATIONS_GROUP:
							return !groupByType;
						default:
							return customCategories.some(category => category._id === key);
					}
				};
				const visibleGroups = groupOrder.filter(isVisibleGroup);
				const groups = new Map(visibleGroups.map(key => [key, [] as TSubscriptionModel[]]));
				chats.forEach(subscription => {
					const group = getRoomGroup(subscription, groups);
					if (group) {
						groups.get(group)?.push(subscription);
					}
				});

				const hasChatsHeader = showUnread || showFavorites || isOmnichannelAgent || hasCustomCategories;
				visibleGroups.forEach(key => {
					const groupChats = groups.get(key) ?? [];
					const customCategory = customCategories.find(category => category._id === key);
					if (customCategory) {
						tempChats.push({ rid: key, separator: true, name: customCategory.name } as TSubscriptionModel);
						tempChats = tempChats.concat(groupChats);
					} else if (key !== CONVERSATIONS_GROUP) {
						tempChats = addRoomsGroup(groupChats, key, tempChats);
					} else if (hasChatsHeader) {
						tempChats = addRoomsGroup(groupChats, CHATS_HEADER, tempChats);
					} else {
						tempChats = tempChats.concat(groupChats);
					}
				});

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
		customCategories,
		hasCustomCategories,
		groupOrder
	]);

	return {
		subscriptions,
		loading
	};
};
