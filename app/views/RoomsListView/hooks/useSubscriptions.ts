import { Q } from '@nozbe/watermelondb';
import { useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import type { Subscription } from 'rxjs';

import { type ISidebarCategory, type TSubscriptionModel } from '~/definitions';
import { SortBy } from '~/lib/constants/constantDisplayMode';
import database from '~/lib/database';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { getUserSelector } from '~/selectors/login';

const CHATS_HEADER = 'Chats';
const UNREAD_HEADER = 'Unread';
const FAVORITES_HEADER = 'Favorites';
const DISCUSSIONS_HEADER = 'Discussions';
const TEAMS_HEADER = 'Teams';
const CHANNELS_HEADER = 'Channels';
const DM_HEADER = 'Direct_Messages';
const OMNICHANNEL_HEADER_IN_PROGRESS = 'Open_Livechats';
const OMNICHANNEL_HEADER_ON_HOLD = 'On_hold_Livechats';
const CUSTOM_CATEGORIES_LICENSE_MODULE = 'experimental-enterprise-features';
const NO_CATEGORIES: ISidebarCategory[] = [];

const filterIsUnread = (s: TSubscriptionModel) => (s.alert || s.unread) && !s.hideUnreadStatus;
const filterIsFavorite = (s: TSubscriptionModel) => s.f;
const filterIsOmnichannel = (s: TSubscriptionModel) => s.t === 'l';
const filterIsTeam = (s: TSubscriptionModel) => s.teamMain;
const filterIsDiscussion = (s: TSubscriptionModel) => s.prid;

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
	const customCategories = useMemo(
		() => (hasCustomCategoriesLicense ? sidebarCategories.filter(category => !category.default) : NO_CATEGORIES),
		[hasCustomCategoriesLicense, sidebarCategories]
	);
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

				customCategories.forEach(category => {
					const categoryChats = chats.filter(s => s.category === category._id);
					chats = chats.filter(s => s.category !== category._id);
					tempChats = addRoomsGroup(categoryChats, category._id, tempChats, category.name);
				});

				// favorites
				if (showFavorites) {
					const favorites = chats.filter(s => filterIsFavorite(s));
					chats = chats.filter(s => !filterIsFavorite(s));
					tempChats = addRoomsGroup(favorites, FAVORITES_HEADER, tempChats);
				}

				// type
				if (groupByType) {
					const teams = chats.filter(s => filterIsTeam(s));
					const discussions = chats.filter(s => filterIsDiscussion(s));
					const channels = chats.filter(s => (s.t === 'c' || s.t === 'p') && !filterIsDiscussion(s) && !filterIsTeam(s));
					const direct = chats.filter(s => s.t === 'd' && !filterIsDiscussion(s) && !filterIsTeam(s));
					tempChats = addRoomsGroup(teams, TEAMS_HEADER, tempChats);
					tempChats = addRoomsGroup(discussions, DISCUSSIONS_HEADER, tempChats);
					tempChats = addRoomsGroup(channels, CHANNELS_HEADER, tempChats);
					tempChats = addRoomsGroup(direct, DM_HEADER, tempChats);
				} else if (showUnread || showFavorites || isOmnichannelAgent || hasCustomCategories) {
					tempChats = addRoomsGroup(chats, CHATS_HEADER, tempChats);
				} else {
					tempChats = chats;
				}

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
		hasCustomCategories
	]);

	return {
		subscriptions,
		loading
	};
};
