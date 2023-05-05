import React from 'react';

export interface IProfileParams {
	realname?: string;
	name?: string;
	username: string;
	email: string | null;
	newPassword: string;
	currentPassword: string;
	bio?: string;
	nickname?: string;
}

export interface IAvatarButton {
	key: string;
	child: React.ReactNode;
	onPress: () => void;
	disabled: boolean;
}

export interface IAvatar {
	data: string | null;
	url?: string;
	contentType?: string;
	service?: any;
}

export interface IAvatarSuggestion {
	url: string;
	blob: string;
	contentType: string;
}
