import React from 'react';
import { View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { avatarURL } from '../../utils/avatar';
import Emoji from '../markdown/Emoji';

export interface IAvatar {
	server?: string;
	style?: any,
	text?: string;
	avatar?: string;
	emoji?: string;
	size?: number;
	borderRadius?: number;
	type?: string;
	children?: JSX.Element;
	user?: {
		id: string;
		token: string;
	};
	theme: string;
	onPress?(): void;
	getCustomEmoji(): any;
	avatarETag?: string;
	isStatic?: boolean;
	rid?: string;
	blockUnauthenticatedAccess?: boolean;
	serverVersion?: string;
}

const Avatar = React.memo(({
	text,
	size,
	server,
	borderRadius,
	style,
	avatar,
	type,
	children,
	user,
	onPress,
	emoji,
	theme,
	getCustomEmoji,
	avatarETag,
	isStatic,
	rid,
	blockUnauthenticatedAccess,
	serverVersion
}: Partial<IAvatar>) => {
	if ((!text && !avatar && !emoji && !rid) || !server) {
		return null;
	}

	const avatarStyle = {
		width: size,
		height: size,
		borderRadius
	};

	let image;
	if (emoji) {
		image = (
			<Emoji
				theme={theme}
				baseUrl={server}
				getCustomEmoji={getCustomEmoji}
				isMessageContainsOnlyEmoji
				literal={emoji}
				style={avatarStyle}
			/>
		);
	} else {
		let uri = avatar;
		if (!isStatic) {
			uri = avatarURL({
				type,
				text,
				size,
				user,
				avatar,
				server,
				avatarETag,
				serverVersion,
				rid,
				blockUnauthenticatedAccess
			});
		}

		image = (
			<FastImage
				style={avatarStyle}
				source={{
					uri,
					headers: RocketChatSettings.customHeaders,
					priority: FastImage.priority.high
				}}
			/>
		);
	}

	if (onPress) {
		image = (
			<Touchable onPress={onPress}>
				{image}
			</Touchable>
		);
	}


	return (
		<View style={[avatarStyle, style]}>
			{image}
			{children}
		</View>
	);
});

export default Avatar;
