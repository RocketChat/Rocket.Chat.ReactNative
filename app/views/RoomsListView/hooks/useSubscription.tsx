import { IUser, TSubscriptionModel } from '../../../definitions';
import { Subscription } from 'rxjs';
import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import { hasPermission } from '../../../lib/methods/helpers';
import { useAppSelector } from '../../../lib/hooks';
import { SortBy } from '../../../lib/constants';
import { filterIsDiscussion, filterIsFavorite, filterIsOmnichannel, filterIsTeam, filterIsUnread } from '../utils/filters';
import { BackHandler } from 'react-native';

const CHATS_HEADER = 'Chats';
const UNREAD_HEADER = 'Unread';
const FAVORITES_HEADER = 'Favorites';
const DISCUSSIONS_HEADER = 'Discussions';
const TEAMS_HEADER = 'Teams';
const CHANNELS_HEADER = 'Channels';
const DM_HEADER = 'Direct_Messages';
const OMNICHANNEL_HEADER_IN_PROGRESS = 'Open_Livechats';
const OMNICHANNEL_HEADER_ON_HOLD = 'On_hold_Livechats';
const QUERY_SIZE = 20;

interface IUseSubscription {
	user: IUser;
	canCreateRoom: boolean;
	setHeader: () => void;
	setLoading: (isLoading: boolean) => void;
}

const useSubscription = ({ user, canCreateRoom, setHeader, setLoading }: IUseSubscription) => {
	const [chats, setChats] = useState<TSubscriptionModel[]>([]);
	const [omnichannelUpdate, setOmnichannelUpdate] = useState<string[]>([]);

	const {
		createDirectMessagePermission,
		createDiscussionPermission,
		createPrivateChannelPermission,
		createPublicChannelPermission,
		createTeamPermission,
		groupByType,
		showFavorites,
		showUnread,
		sortBy,
		useRealName
	} = useAppSelector(state => ({
		sortBy: state.sortPreferences.sortBy,
		groupByType: state.sortPreferences.groupByType,
		showFavorites: state.sortPreferences.showFavorites,
		showUnread: state.sortPreferences.showUnread,
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		createTeamPermission: state.permissions['create-team'],
		createDirectMessagePermission: state.permissions['create-d'],
		createPublicChannelPermission: state.permissions['create-c'],
		createPrivateChannelPermission: state.permissions['create-p'],
		createDiscussionPermission: state.permissions['start-discussion']
	}));

	let querySubscription: Subscription;
	const isGrouping = showUnread || showFavorites || groupByType;

	const unsubscribeQuery = () => {
		if (querySubscription && querySubscription.unsubscribe) {
			querySubscription.unsubscribe();
		}
	};

	const getSubscriptions = async () => {
		unsubscribeQuery();

		const db = database.active;
		let observable;
		let count = 0;

		const defaultWhereClause = [Q.where('archived', false), Q.where('open', true)] as (Q.WhereDescription | Q.SortBy)[];

		if (sortBy === SortBy.Alphabetical) {
			defaultWhereClause.push(Q.sortBy(`${useRealName ? 'fname' : 'name'}`, Q.asc));
		} else {
			defaultWhereClause.push(Q.sortBy('room_updated_at', Q.desc));
		}

		// When we're grouping by something
		if (isGrouping) {
			observable = await db
				.get('subscriptions')
				.query(...defaultWhereClause)
				.observeWithColumns(['alert', 'on_hold', 'f']);
			// When we're NOT grouping
		} else {
			count += QUERY_SIZE;
			observable = await db
				.get('subscriptions')
				.query(...defaultWhereClause, Q.skip(0), Q.take(count))
				.observeWithColumns(['on_hold']);
		}

		querySubscription = observable.subscribe(data => {
			let tempChats = [] as TSubscriptionModel[];
			let chats = data;

			let omnichannelsUpdate: string[] = [];
			const isOmnichannelAgent = user?.roles?.includes('livechat-agent');
			if (isOmnichannelAgent) {
				const omnichannel = chats.filter(s => filterIsOmnichannel(s));
				const omnichannelInProgress = omnichannel.filter(s => !s.onHold);
				const omnichannelOnHold = omnichannel.filter(s => s.onHold);
				chats = chats.filter(s => !filterIsOmnichannel(s));
				omnichannelsUpdate = omnichannelInProgress.map(s => s.rid);
				tempChats = addRoomsGroup(omnichannelInProgress, OMNICHANNEL_HEADER_IN_PROGRESS, tempChats);
				tempChats = addRoomsGroup(omnichannelOnHold, OMNICHANNEL_HEADER_ON_HOLD, tempChats);
			}

			// unread
			if (showUnread) {
				const unread = chats.filter(s => filterIsUnread(s));
				chats = chats.filter(s => !filterIsUnread(s));
				tempChats = addRoomsGroup(unread, UNREAD_HEADER, tempChats);
			}

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
			} else if (showUnread || showFavorites || isOmnichannelAgent) {
				tempChats = addRoomsGroup(chats, CHATS_HEADER, tempChats);
			} else {
				tempChats = chats;
			}

			const chatsUpdate = tempChats.map(item => item.rid);
			setChats(tempChats);
			setLoading(false);
			setOmnichannelUpdate(omnichannelsUpdate);
		});
	};

	const addRoomsGroup = (data: TSubscriptionModel[], header: string, allData: TSubscriptionModel[]) => {
		if (data.length > 0) {
			if (header) {
				allData.push({ rid: header, separator: true } as TSubscriptionModel);
			}
			allData = allData.concat(data);
		}
		return allData;
	};

	const onEndReached = () => {
		if (!isGrouping) {
			getSubscriptions();
		}
	};

	useEffect(() => {
		getSubscriptions();

		return () => {
			unsubscribeQuery();
		};
	}, []);

	return {
		chats,
		omnichannelUpdate,
		onEndReached,
		canCreateRoom
	};
};

export default useSubscription;
