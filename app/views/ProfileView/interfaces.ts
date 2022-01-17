import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';

import { ProfileStackParamList } from '../../stacks/types';

export interface IUser {
	id: string;
	name: string;
	username: string;
	emails: {
		[index: number]: {
			address: string;
		};
	};
	customFields: {
		[index: string | number]: string;
	};
}

export interface IParams {
	name: string;
	username: string;
	email: string | null;
	newPassword: string;
	currentPassword: string;
}

export interface IAvatarButton {
	key: string;
	child: React.ReactNode;
	onPress: () => void;
	disabled: boolean;
}

export interface INavigationOptions {
	navigation: StackNavigationProp<ProfileStackParamList, 'ProfileView'>;
	isMasterDetail?: boolean;
}

export interface IProfileViewProps {
	user: IUser;
	baseUrl: string;
	Accounts_AllowEmailChange: boolean;
	Accounts_AllowPasswordChange: boolean;
	Accounts_AllowRealNameChange: boolean;
	Accounts_AllowUserAvatarChange: boolean;
	Accounts_AllowUsernameChange: boolean;
	Accounts_CustomFields: string;
	setUser: Function;
	theme: string;
}

export interface IAvatar {
	data: {} | string | null;
	url?: string;
	contentType?: string;
	service?: any;
}

export interface IProfileViewState {
	saving: boolean;
	name: string;
	username: string;
	email: string | null;
	newPassword: string | null;
	currentPassword: string | null;
	avatarUrl: string | null;
	avatar: IAvatar;
	avatarSuggestions: {
		[service: string]: {
			url: string;
			blob: string;
			contentType: string;
		};
	};
	customFields: {
		[key: string | number]: string;
	};
}
