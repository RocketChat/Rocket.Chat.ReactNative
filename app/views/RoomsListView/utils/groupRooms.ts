import { type TSubscriptionModel } from '~/definitions';
import {
	CHANNELS_GROUP,
	CONVERSATIONS_GROUP,
	DIRECT_MESSAGES_GROUP,
	DISCUSSIONS_GROUP,
	FAVORITES_GROUP,
	isVisibleGroup,
	TEAMS_GROUP
} from './sidebarGroupOrder';

const CHATS_HEADER = 'Chats';
const UNREAD_HEADER = 'Unread';
const OMNICHANNEL_HEADER_IN_PROGRESS = 'Open_Livechats';
const OMNICHANNEL_HEADER_ON_HOLD = 'On_hold_Livechats';
const UNREAD_GROUP = 'Unread';
const OMNICHANNEL_IN_PROGRESS_GROUP = 'Open_Livechats';
const OMNICHANNEL_ON_HOLD_GROUP = 'On_Hold_Chats';

const CATEGORY_ID_BY_HEADER: Record<string, string> = {
	[CHATS_HEADER]: CONVERSATIONS_GROUP,
	[OMNICHANNEL_HEADER_ON_HOLD]: OMNICHANNEL_ON_HOLD_GROUP
};

export const categoryIdOfHeader = (header: string) => CATEGORY_ID_BY_HEADER[header] ?? header;

const filterIsUnread = (subscription: TSubscriptionModel) =>
	(subscription.alert || subscription.unread || subscription.tunread?.length) && !subscription.hideUnreadStatus;

const filterIsOmnichannel = (subscription: TSubscriptionModel) => subscription.t === 'l';

const sumOf = (rooms: TSubscriptionModel[], count: (room: TSubscriptionModel) => number | undefined) =>
	rooms.reduce((total, room) => total + (count(room) ?? 0), 0);

const NO_THREADS: string[] = [];

const threadsOf = (rooms: TSubscriptionModel[], threads: (room: TSubscriptionModel) => string[] | undefined) => {
	const roomThreads = rooms.flatMap(room => threads(room) ?? []);
	return roomThreads.length ? roomThreads : NO_THREADS;
};

export type CategoryUnreadOptions = {
	showUnreads: boolean;
	keepUnreadsOnTop: boolean;
};

const NO_UNREAD_OPTIONS: CategoryUnreadOptions = { showUnreads: false, keepUnreadsOnTop: false };

type SectionHeaderOptions = {
	rooms: TSubscriptionModel[];
	badgeSourceRooms: TSubscriptionModel[];
	header: string;
	title: string | undefined;
	collapsed: boolean;
};

const sectionHeader = ({ rooms, badgeSourceRooms, header, title, collapsed }: SectionHeaderOptions) => {
	const badgedRooms = badgeSourceRooms.filter(room => !room.hideUnreadStatus);
	return {
		rid: header,
		separator: true,
		name: title,
		collapsed,
		empty: !rooms.length,
		unread: sumOf(badgedRooms, room => room.unread || room.tunread?.length || (room.alert ? 1 : 0)),
		userMentions: sumOf(badgedRooms, room => room.userMentions),
		groupMentions: sumOf(badgedRooms, room => room.groupMentions),
		tunread: threadsOf(badgedRooms, room => room.tunread),
		tunreadUser: threadsOf(badgedRooms, room => room.tunreadUser),
		tunreadGroup: threadsOf(badgedRooms, room => room.tunreadGroup)
	} as TSubscriptionModel;
};

const unreadFirst = (rooms: TSubscriptionModel[]) => [
	...rooms.filter(filterIsUnread),
	...rooms.filter(subscription => !filterIsUnread(subscription))
];

type RoomsGroupOptions = {
	collapsedGroups: ReadonlySet<string>;
	title?: string;
	unreadOptions?: CategoryUnreadOptions;
	keepWhenEmpty?: boolean;
};

const roomsGroup = (
	rooms: TSubscriptionModel[],
	header: string,
	{ collapsedGroups, title, unreadOptions = NO_UNREAD_OPTIONS, keepWhenEmpty = false }: RoomsGroupOptions
) => {
	const { showUnreads, keepUnreadsOnTop } = unreadOptions;
	if (!rooms.length && !(header && keepWhenEmpty)) {
		return [];
	}
	const orderedRooms = keepUnreadsOnTop ? unreadFirst(rooms) : rooms;
	if (!header) {
		return orderedRooms;
	}
	const collapsed = collapsedGroups.has(header);
	if (!collapsed) {
		return [sectionHeader({ rooms, badgeSourceRooms: rooms, header, title, collapsed }), ...orderedRooms];
	}
	const visibleRooms = showUnreads ? orderedRooms.filter(filterIsUnread) : [];
	const hiddenRooms = orderedRooms.filter(room => !visibleRooms.includes(room));
	return [sectionHeader({ rooms, badgeSourceRooms: hiddenRooms, header, title, collapsed }), ...visibleRooms];
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
	categoryUnreadOptions: Map<string, CategoryUnreadOptions>;
	showFavorites: boolean;
	groupByType: boolean;
	hasChatsHeader: boolean;
	collapsedGroups: ReadonlySet<string>;
};

const groupRooms = (
	chats: TSubscriptionModel[],
	{
		groupOrder,
		customCategoryNames,
		categoryUnreadOptions,
		showFavorites,
		groupByType,
		hasChatsHeader,
		collapsedGroups
	}: GroupRoomsOptions
) => {
	const visibleGroups = groupOrder.filter(key => isVisibleGroup(key, { customCategoryNames, showFavorites, groupByType }));
	const groups = new Map(visibleGroups.map(key => [key, [] as TSubscriptionModel[]]));
	chats.forEach(subscription => {
		const group = getRoomGroup(subscription, groups);
		if (group) {
			groups.get(group)?.push(subscription);
		}
	});

	return visibleGroups.flatMap(key => {
		const header = key === CONVERSATIONS_GROUP ? (hasChatsHeader ? CHATS_HEADER : '') : key;
		return roomsGroup(groups.get(key) ?? [], header, {
			collapsedGroups,
			title: customCategoryNames.get(key),
			unreadOptions: categoryUnreadOptions.get(key),
			keepWhenEmpty: customCategoryNames.has(key)
		});
	});
};

type BuildRoomListOptions = Omit<GroupRoomsOptions, 'hasChatsHeader'> & {
	sectionsOrder: readonly string[];
	showUnread: boolean;
	isOmnichannelAgent: boolean;
};

export const buildRoomList = (subscriptions: TSubscriptionModel[], options: BuildRoomListOptions) => {
	const {
		groupOrder,
		customCategoryNames,
		categoryUnreadOptions,
		sectionsOrder,
		showUnread,
		showFavorites,
		groupByType,
		isOmnichannelAgent,
		collapsedGroups
	} = options;
	const showsSection = (key: string) => sectionsOrder.includes(key);
	let remainingSubscriptions = subscriptions;
	const roomList: TSubscriptionModel[] = [];

	if (isOmnichannelAgent) {
		const omnichannel = remainingSubscriptions.filter(filterIsOmnichannel);
		remainingSubscriptions = remainingSubscriptions.filter(subscription => !filterIsOmnichannel(subscription));
		if (showsSection(OMNICHANNEL_IN_PROGRESS_GROUP)) {
			roomList.push(
				...roomsGroup(
					omnichannel.filter(subscription => !subscription.onHold),
					OMNICHANNEL_HEADER_IN_PROGRESS,
					{ collapsedGroups, unreadOptions: categoryUnreadOptions.get(OMNICHANNEL_IN_PROGRESS_GROUP) }
				)
			);
		}
		if (showsSection(OMNICHANNEL_ON_HOLD_GROUP)) {
			roomList.push(
				...roomsGroup(
					omnichannel.filter(subscription => subscription.onHold),
					OMNICHANNEL_HEADER_ON_HOLD,
					{ collapsedGroups, unreadOptions: categoryUnreadOptions.get(OMNICHANNEL_ON_HOLD_GROUP) }
				)
			);
		}
	}

	if (showUnread && showsSection(UNREAD_GROUP)) {
		const unread = remainingSubscriptions.filter(filterIsUnread);
		remainingSubscriptions = remainingSubscriptions.filter(subscription => !filterIsUnread(subscription));
		roomList.push(
			...roomsGroup(unread, UNREAD_HEADER, { collapsedGroups, unreadOptions: categoryUnreadOptions.get(UNREAD_GROUP) })
		);
	}

	return roomList.concat(
		groupRooms(remainingSubscriptions, {
			groupOrder,
			customCategoryNames,
			categoryUnreadOptions,
			showFavorites,
			groupByType,
			collapsedGroups,
			hasChatsHeader: showUnread || showFavorites || isOmnichannelAgent || customCategoryNames.size > 0
		})
	);
};

export const roomsInSection = (roomList: TSubscriptionModel[], header: string) => {
	const headerIndex = roomList.findIndex(room => room.separator && room.rid === header);
	if (headerIndex < 0) {
		return [];
	}
	const nextHeaderIndex = roomList.findIndex((room, index) => index > headerIndex && room.separator);
	return roomList.slice(headerIndex + 1, nextHeaderIndex < 0 ? undefined : nextHeaderIndex);
};
