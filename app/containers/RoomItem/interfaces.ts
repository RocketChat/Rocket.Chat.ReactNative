import React from 'react';
import { Animated } from 'react-native';

import { TUserStatus, ILastMessage, SubscriptionType } from '../../definitions';

export interface ILeftActions {
	theme: string;
	transX: Animated.AnimatedAddition | Animated.AnimatedMultiplication;
	isRead: boolean;
	width: number;
	onToggleReadPress(): void;
	displayMode: string;
}

export interface IRightActions {
	theme: string;
	transX: Animated.AnimatedAddition | Animated.AnimatedMultiplication;
	favorite: boolean;
	width: number;
	toggleFav(): void;
	onHidePress(): void;
	displayMode: string;
}

export interface ITitle {
	name: string;
	theme: string;
	hideUnreadStatus: boolean;
	alert: boolean;
}

export interface IUpdatedAt {
	date: string;
	theme: string;
	hideUnreadStatus: boolean;
	alert: boolean;
}

export interface IWrapper {
	accessibilityLabel: string;
	avatar: string;
	avatarSize: number;
	type: string;
	theme: string;
	rid: string;
	children: React.ReactElement;
	displayMode: string;
	prid: string;
	showLastMessage: boolean;
	status: string;
	isGroupChat: boolean;
	teamMain: boolean;
	showAvatar: boolean;
}

export interface ITypeIcon {
	type: string;
	status: TUserStatus;
	prid: string;
	isGroupChat: boolean;
	teamMain: boolean;
	theme?: string;
	size?: number;
	style?: object;
}

export interface IRoomItemContainer {
	[key: string]: string | boolean | Function | number;
	item: any;
	showLastMessage: boolean;
	id: string;
	onPress: (item: any) => void;
	onLongPress: (item: any) => Promise<void>;
	username: string;
	avatarSize: number;
	width: number;
	status: TUserStatus;
	toggleFav(): void;
	toggleRead(): void;
	hideChannel(): void;
	useRealName: boolean;
	getUserPresence: (uid: string) => void;
	connected: boolean;
	theme: string;
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

export interface IRoomItem {
	rid: string;
	type: SubscriptionType;
	prid: string;
	name: string;
	avatar: string;
	showLastMessage: boolean;
	username: string;
	avatarSize: number;
	testID: string;
	width: number;
	status: TUserStatus;
	useRealName: boolean;
	theme: string;
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
}

export interface ILastMessageComponent {
	theme: string;
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
	theme: string;
	isFocused: boolean;
	swipeEnabled: boolean;
	displayMode: string;
}
