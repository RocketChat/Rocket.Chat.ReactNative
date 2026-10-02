/**
 * Mirror of `@rocket.chat/apps-engine/definition/ui`, which isn't a dependency here.
 * Keep in sync with the server: packages/apps-engine/src/definition/ui.
 */

export const UIActionButtonContext = {
	MESSAGE_ACTION: 'messageAction',
	ROOM_ACTION: 'roomAction',
	MESSAGE_BOX_ACTION: 'messageBoxAction',
	USER_DROPDOWN_ACTION: 'userDropdownAction',
	ROOM_SIDEBAR_ACTION: 'roomSideBarAction'
} as const;

export type TUIActionButtonContext = (typeof UIActionButtonContext)[keyof typeof UIActionButtonContext];

export const RoomTypeFilter = {
	PUBLIC_CHANNEL: 'public_channel',
	PRIVATE_CHANNEL: 'private_channel',
	PUBLIC_TEAM: 'public_team',
	PRIVATE_TEAM: 'private_team',
	PUBLIC_DISCUSSION: 'public_discussion',
	PRIVATE_DISCUSSION: 'private_discussion',
	DIRECT: 'direct',
	DIRECT_MULTIPLE: 'direct_multiple',
	LIVE_CHAT: 'livechat'
} as const;

export type TRoomTypeFilter = (typeof RoomTypeFilter)[keyof typeof RoomTypeFilter];

export type TAppActionButtonCategory = 'default' | 'ai';

export interface IAppActionButtonWhen {
	roomTypes?: TRoomTypeFilter[];
	messageActionContext?: string[];
	hasOnePermission?: string[];
	hasAllPermissions?: string[];
	hasOneRole?: string[];
	hasAllRoles?: string[];
}

export interface IAppActionButton {
	appId: string;
	actionId: string;
	context: TUIActionButtonContext;
	labelI18n: string;
	variant?: 'danger';
	when?: IAppActionButtonWhen;
	category?: TAppActionButtonCategory;
}

export interface IAppActionButtonRoom {
	t?: string;
	teamMain?: boolean;
	prid?: string;
	uids?: string[];
}

export interface IAppLanguages {
	apps: {
		id: string;
		languages: { [language: string]: { [key: string]: string } };
	}[];
}

export const getIdForActionButton = ({ appId, actionId }: IAppActionButton): string => `${appId}/${actionId}`;
