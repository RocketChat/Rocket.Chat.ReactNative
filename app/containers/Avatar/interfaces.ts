import React from 'react';

import { TGetCustomEmoji } from '../../definitions/IEmoji';

export interface IAvatar {
	server?: string;
	style?: any;
	text: string;
	avatar?: string;
	emoji?: string;
	size?: number;
	borderRadius?: number;
	type?: string;
	children?: React.ReactElement | null;
	user?: {
		id?: string;
		token?: string;
	};
	theme?: string;
	onPress?: () => void;
	getCustomEmoji?: TGetCustomEmoji;
	avatarETag?: string;
	isStatic?: boolean | string;
	rid?: string;
	blockUnauthenticatedAccess?: boolean;
	serverVersion: string;
}
