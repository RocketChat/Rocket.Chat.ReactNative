import type { ViewStyle } from 'react-native';
import type { ReactElement } from 'react';

import type { TGetCustomEmoji } from '../../definitions/IEmoji';

export interface IAvatar {
	server?: string;
	style?: ViewStyle;
	text?: string;
	avatar?: string;
	emoji?: string;
	size?: number;
	borderRadius?: number;
	type?: string;
	children?: ReactElement | null;
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
	accessible?: boolean;
}
