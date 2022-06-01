import React from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { avatarURL } from '../../utils/avatar';
import { SubscriptionType } from '../../definitions/ISubscription';
import Emoji from '../markdown/Emoji';
import { IAvatar } from './interfaces';
import { useTheme } from '../../theme';

const Avatar = React.memo(
	({
		server,
		style,
		avatar,
		children,
		user,
		onPress,
		emoji,
		getCustomEmoji,
		avatarETag,
		isStatic,
		rid,
		blockUnauthenticatedAccess,
		serverVersion,
		text,
		size = 25,
		borderRadius = 4,
		type = SubscriptionType.DIRECT,
		externalProviderUrl
	}: IAvatar) => {
		const { theme } = useTheme();

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
					blockUnauthenticatedAccess,
					externalProviderUrl
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
			image = <Touchable onPress={onPress}>{image}</Touchable>;
		}

		return (
			<View style={[avatarStyle, style]} testID='avatar'>
				{image}
				{children}
			</View>
		);
	}
);

export default Avatar;
