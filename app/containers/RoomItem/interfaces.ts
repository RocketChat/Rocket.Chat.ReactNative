import React from 'react';
import Animated from 'react-native-reanimated';

import { TSupportedThemes } from '../../theme';
import { TUserStatus, ILastMessage, SubscriptionType, IOmnichannelSource } from '../../definitions';

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
	theme: TSupportedThemes;
	hideUnreadStatus: boolean;
	alert: boolean;
}

export interface IUpdatedAtProps {
	date: string;
	theme: TSupportedThemes;
	hideUnreadStatus: boolean;
	alert: boolean;
}

export interface IWrapperProps {
	accessibilityLabel: string;
	avatar: string;
	type: string;
	theme: TSupportedThemes;
	rid: string;
	children: React.ReactElement;
	displayMode: string;
	prid: string;
	showLastMessage: boolean;
	status: string;
	isGroupChat: boolean;
	teamMain: boolean;
	showAvatar: boolean;
	sourceType: IOmnichannelSource;
}

export interface ITypeIconProps {
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

export interface IRoomItemContainerProps {
	[key: string]: string | boolean | Function | number;
	item: any;
	showLastMessage: boolean;
	id: string;
	onPress: (item: any) => void;
	onLongPress: (item: any) => Promise<void>;
	username: string;
	width: number;
	status: TUserStatus;
	toggleFav(): void;
	toggleRead(): void;
	hideChannel(): void;
	useRealName: boolean;
	getUserPresence: (uid: string) => void;
	connected: boolean;
	theme: TSupportedThemes;
	isFocused: boolean;
	getRoomTitle: (item: any) => string;
	getRoomAvatar: (item: any) => string;
	getIsGroupChat: (item: any) => boolean;
	getIsRead: (item: any) => boolean;
	swipeEnabled: boolean;
	autoJoin: boolean;
	showAvatar: boolean;
	displayMode: string;
}

export interface IRoomItemProps {
	rid: string;
	type: SubscriptionType;
	prid: string;
	name: string;
	avatar: string;
	showLastMessage: boolean;
	username: string;
	testID: string;
	width: number;
	status: TUserStatus;
	useRealName: boolean;
	theme: TSupportedThemes;
	isFocused: boolean;
	isGroupChat: boolean;
	isRead: boolean;
	teamMain: boolean;
	date: string;
	accessibilityLabel: string;
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
	swipeEnabled: boolean;
	toggleFav(): void;
	toggleRead(): void;
	onPress(): void;
	onLongPress(): void;
	hideChannel(): void;
	autoJoin: boolean;
	size?: number;
	showAvatar: boolean;
	displayMode: string;
	sourceType: IOmnichannelSource;
}

export interface ILastMessageProps {
	theme: TSupportedThemes;
	lastMessage: ILastMessage;
	type: SubscriptionType;
	showLastMessage: boolean;
	username: string;
	useRealName: boolean;
	alert: boolean;
}

export interface ITouchableProps {
	children: JSX.Element;
	type: string;
	onPress(): void;
	onLongPress(): void;
	testID: string;
	width: number;
	favorite: boolean;
	isRead: boolean;
	rid: string;
	toggleFav: Function;
	toggleRead: Function;
	hideChannel: Function;
	isFocused: boolean;
	swipeEnabled: boolean;
	displayMode: string;
}
