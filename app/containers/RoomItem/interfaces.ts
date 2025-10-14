import type React from 'react';
import type Animated from 'react-native-reanimated';

import { type TSupportedThemes } from '../../theme';
import { type TUserStatus, type ILastMessage, type SubscriptionType, type IOmnichannelSource, type ISubscription } from '../../definitions';

export interface ILeftActionsProps {
	transX: Animated.SharedValue<number>;
	isRead: boolean;
	width: number;
	onToggleReadPress(): void;
	displayMode: string;
}

export interface IRightActionsProps {
	transX: Animated.SharedValue<number>;
	favorite: boolean;
	width: number;
	toggleFav(): void;
	onHidePress(): void;
	displayMode: string;
}

export interface ITitleProps {
	name: string;
	hideUnreadStatus: boolean;
	alert: boolean;
}

export interface IUpdatedAtProps {
	date: string;
	hideUnreadStatus: boolean;
	alert: boolean;
}

export interface IWrapperProps {
	accessibilityLabel: string;
	avatar: string;
	type: string;
	userId: string | null;
	rid: string;
	children: React.ReactElement;
	displayMode: string;
	prid: string;
	showLastMessage: boolean;
	status: TUserStatus;
	isGroupChat: boolean;
	teamMain: boolean;
	showAvatar: boolean;
	sourceType: IOmnichannelSource;
}

export interface ITypeIconProps {
	userId: string | null;
	type: string;
	status: TUserStatus;
	prid: string;
	isGroupChat: boolean;
	teamMain: boolean;
	theme?: TSupportedThemes;
	size?: number;
	style?: object;
	sourceType: IOmnichannelSource;
}

interface IRoomItemTouchables {
	toggleFav?: (rid: string, favorite: boolean) => Promise<void>;
	toggleRead?: (rid: string, tIsRead: boolean) => Promise<void>;
	hideChannel?: (rid: string, type: SubscriptionType) => Promise<void>;
	onPress: (item?: any) => void;
	onLongPress?: (item?: any) => void;
}

interface IBaseRoomItem extends IRoomItemTouchables {
	[key: string]: any;
	showLastMessage?: boolean;
	useRealName: boolean;
	isFocused?: boolean;
	displayMode: string;
	showAvatar: boolean;
	swipeEnabled: boolean;
	autoJoin?: boolean;
	width: number;
	username?: string;
}

export interface IRoomItemContainerProps extends IBaseRoomItem {
	item: any;
	id?: string;
	getRoomTitle: (item: any) => string;
	getRoomAvatar: (item: any) => string;
	getIsRead?: (item: any) => boolean;
}

export interface IRoomItemProps extends IBaseRoomItem {
	rid: string;
	type: SubscriptionType;
	prid: string;
	name: string;
	avatar: string;
	testID: string;
	status: TUserStatus;
	isGroupChat: boolean;
	isRead: boolean;
	teamMain: boolean;
	date: string;
	lastMessage: ILastMessage;
	favorite: boolean;
	alert: boolean;
	hideUnreadStatus: boolean;
	unread: number;
	userMentions: number;
	groupMentions: number;
	tunread: [];
	tunreadUser: [];
	tunreadGroup: [];
	size?: number;
	sourceType: IOmnichannelSource;
	hideMentionStatus?: boolean;
	accessibilityDate: string;
}

export interface ILastMessageProps {
	lastMessage: ILastMessage;
	type: SubscriptionType;
	showLastMessage: boolean;
	username: string;
	useRealName: boolean;
	alert: boolean;
}

export interface ITouchableProps extends IRoomItemTouchables {
	children: JSX.Element;
	type: SubscriptionType;
	testID: string;
	width: number;
	favorite: boolean;
	isRead: boolean;
	rid: string;
	isFocused: boolean;
	swipeEnabled: boolean;
	displayMode: string;
}

export interface IIconOrAvatar {
	avatar: string;
	type: string;
	rid: string;
	userId: string | null;
	showAvatar: boolean;
	displayMode: string;
	prid: string;
	status: TUserStatus;
	isGroupChat: boolean;
	teamMain: boolean;
	showLastMessage: boolean;
	sourceType: IOmnichannelSource;
}

export interface IRoomItem extends ISubscription {
	search?: boolean;
	outside?: boolean;
}
