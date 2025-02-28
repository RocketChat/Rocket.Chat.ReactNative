import React from 'react';
import { ViewStyle } from 'react-native';

import { TGetCustomEmoji } from '../../definitions/IEmoji';

export interface IAvatar {
	server?: string;
	style?: ViewStyle;
	text?: string;
	avatar?: string;
	emoji?: string;
	size?: number;
	borderRadius?: number;
	type?: string;
	children?: React.ReactElement | null;
	userId?: string;
	token?: string;
	onPress?: () => void;
	getCustomEmoji?: TGetCustomEmoji;
	avatarETag?: string;
	isStatic?: boolean | string;
	rid?: string;
	blockUnauthenticatedAccess?: boolean;
	serverVersion?: string | null;
	avatarExternalProviderUrl?: string;
	roomAvatarExternalProviderUrl?: string;
	cdnPrefix?: string;
	accessibilityLabel?: string;
}
