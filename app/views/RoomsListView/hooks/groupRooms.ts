import { type TSubscriptionModel } from '~/definitions';
import {
	CHANNELS_GROUP,
	CONVERSATIONS_GROUP,
	DIRECT_MESSAGES_GROUP,
	DISCUSSIONS_GROUP,
	FAVORITES_GROUP,
	TEAMS_GROUP
} from './sidebarGroupOrder';

const CHATS_HEADER = 'Chats';
const UNREAD_HEADER = 'Unread';
const OMNICHANNEL_HEADER_IN_PROGRESS = 'Open_Livechats';
const OMNICHANNEL_HEADER_ON_HOLD = 'On_hold_Livechats';

const filterIsUnread = (subscription: TSubscriptionModel) =>
	(subscription.alert || subscription.unread) && !subscription.hideUnreadStatus;

const filterIsOmnichannel = (subscription: TSubscriptionModel) => subscription.t === 'l';

const sumOf = (rooms: TSubscriptionModel[], count: (room: TSubscriptionModel) => number | undefined) =>
	rooms.reduce((total, room) => total + (count(room) ?? 0), 0);

const threadsOf = (rooms: TSubscriptionModel[], threads: (room: TSubscriptionModel) => string[] | undefined) =>
	rooms.flatMap(room => threads(room) ?? []);

const sectionHeader = (rooms: TSubscriptionModel[], header: string, title: string | undefined) => {
	const badgedRooms = rooms.filter(room => !room.hideUnreadStatus);
	return {
		rid: header,
		separator: true,
		name: title,
		unread: sumOf(badgedRooms, room => room.unread || room.tunread?.length),
		userMentions: sumOf(badgedRooms, room => room.userMentions),
		groupMentions: sumOf(badgedRooms, room => room.groupMentions),
		tunread: threadsOf(badgedRooms, room => room.tunread),
		tunreadUser: threadsOf(badgedRooms, room => room.tunreadUser),
		tunreadGroup: threadsOf(badgedRooms, room => room.tunreadGroup)
	} as TSubscriptionModel;
};

const roomsGroup = (rooms: TSubscriptionModel[], header: string, collapsedGroups: ReadonlySet<string>, title?: string) => {
	if (!rooms.length) {
		return [];
	}
	if (!header) {
		return rooms;
	}
	const collapsed = collapsedGroups.has(header);
	return [sectionHeader(rooms, header, title), ...(collapsed ? [] : rooms)];
};

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

type GroupRoomsOptions = {
	groupOrder: string[];
	customCategoryNames: Map<string, string>;
	showFavorites: boolean;
	groupByType: boolean;
	hasChatsHeader: boolean;
	collapsedGroups: ReadonlySet<string>;
};

const groupRooms = (
	chats: TSubscriptionModel[],
	{ groupOrder, customCategoryNames, showFavorites, groupByType, hasChatsHeader, collapsedGroups }: GroupRoomsOptions
) => {
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
				return customCategoryNames.has(key);
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

	return visibleGroups.flatMap(key => {
		const header = key === CONVERSATIONS_GROUP ? (hasChatsHeader ? CHATS_HEADER : '') : key;
		return roomsGroup(groups.get(key) ?? [], header, collapsedGroups, customCategoryNames.get(key));
	});
};

type BuildRoomListOptions = Omit<GroupRoomsOptions, 'hasChatsHeader'> & {
	showUnread: boolean;
	isOmnichannelAgent: boolean;
};

export const buildRoomList = (subscriptions: TSubscriptionModel[], options: BuildRoomListOptions) => {
	const { groupOrder, showUnread, showFavorites, groupByType, isOmnichannelAgent, collapsedGroups } = options;
	const customCategoryNames = groupByType ? options.customCategoryNames : new Map<string, string>();
	let remainingSubscriptions = subscriptions;
	const roomList: TSubscriptionModel[] = [];

	if (isOmnichannelAgent) {
		const omnichannel = remainingSubscriptions.filter(filterIsOmnichannel);
		remainingSubscriptions = remainingSubscriptions.filter(subscription => !filterIsOmnichannel(subscription));
		roomList.push(
			...roomsGroup(
				omnichannel.filter(subscription => !subscription.onHold),
				OMNICHANNEL_HEADER_IN_PROGRESS,
				collapsedGroups
			),
			...roomsGroup(
				omnichannel.filter(subscription => subscription.onHold),
				OMNICHANNEL_HEADER_ON_HOLD,
				collapsedGroups
			)
		);
	}

	if (showUnread) {
		const unread = remainingSubscriptions.filter(filterIsUnread);
		remainingSubscriptions = remainingSubscriptions.filter(subscription => !filterIsUnread(subscription));
		roomList.push(...roomsGroup(unread, UNREAD_HEADER, collapsedGroups));
	}

	return roomList.concat(
		groupRooms(remainingSubscriptions, {
			groupOrder,
			customCategoryNames,
			showFavorites,
			groupByType,
			collapsedGroups,
			hasChatsHeader: showUnread || showFavorites || isOmnichannelAgent || customCategoryNames.size > 0
		})
	);
};
