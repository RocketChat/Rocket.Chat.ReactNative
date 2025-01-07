import React from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getAvatarURL } from '../../lib/methods/helpers/getAvatarUrl';
import { SubscriptionType } from '../../definitions';
import Emoji from '../markdown/components/Emoji';
import { IAvatar } from './interfaces';
import MarkdownContext from '../markdown/contexts/MarkdownContext';
import { store } from '../../lib/store/auxStore';

const Avatar = React.memo(
	({
		server,
		style,
		avatar,
		children,
		userId,
		token,
		onPress,
		emoji,
		avatarETag,
		isStatic,
		rid,
		blockUnauthenticatedAccess,
		serverVersion,
		text,
		size = 25,
		borderRadius = 4,
		type = SubscriptionType.DIRECT,
		avatarExternalProviderUrl,
		roomAvatarExternalProviderUrl,
		cdnPrefix
	}: IAvatar) => {
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
			const getCustomEmoji = () => {
				if (process.env.STORYBOOK_ENABLED) {
					return { name: 'troll', extension: 'jpg' };
				}
				const customEmojis = store?.getState()?.customEmojis;
				const customEmoji = customEmojis[emoji];
				if (customEmoji) {
					return customEmoji;
				}
				return null;
			};
			image = (
				<MarkdownContext.Provider
					value={{
						getCustomEmoji
					}}>
					<Emoji block={{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: emoji }, shortCode: emoji }} style={avatarStyle} />
				</MarkdownContext.Provider>
			);
		} else {
			let uri = avatar;
			if (!isStatic) {
				uri = getAvatarURL({
					type,
					text,
					size,
					userId,
					token,
					avatar,
					server,
					avatarETag,
					serverVersion,
					rid,
					blockUnauthenticatedAccess,
					avatarExternalProviderUrl,
					roomAvatarExternalProviderUrl,
					cdnPrefix
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
