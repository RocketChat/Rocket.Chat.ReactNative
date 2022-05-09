import React from 'react';

export interface IProfileParams {
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

export interface IAvatar {
	data: {} | string | null;
	url?: string;
	contentType?: string;
	service?: any;
}

export interface IAvatarSuggestion {
	[service: string]: {
		url: string;
		blob: string;
		contentType: string;
	};
}
