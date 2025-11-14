import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import Emoji from '../markdown/components/emoji/Emoji';
import { getAvatarURL } from '../../lib/methods/helpers/getAvatarUrl';
import { SubscriptionType } from '../../definitions';
import { type IAvatar } from './interfaces';
import MarkdownContext from '../markdown/contexts/MarkdownContext';
import I18n from '../../i18n';

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
		avatarExternalProviderUrl,
		roomAvatarExternalProviderUrl,
		cdnPrefix,
		accessibilityLabel
	}: IAvatar) => {
		// Compute avatar URI with memoization to ensure it updates when dependencies change
		// Hooks must be called before early return
		const avatarUri = useMemo(() => {
			if (isStatic) {
				return avatar;
			}
			let uri = getAvatarURL({
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
			
			// Add cache busting parameter using avatarETag to force fresh fetch when avatar changes
			// The avatarETag changes when avatar is updated, ensuring URL changes and cache is invalidated
			if (avatarETag && uri && !uri.includes('_cb=')) {
				const separator = uri.includes('?') ? '&' : '?';
				uri = `${uri}${separator}_cb=${encodeURIComponent(avatarETag)}`;
			}
			
			return uri;
		}, [
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
			cdnPrefix,
			isStatic
		]);

		// Create a cache key that changes when avatar or avatarETag changes
		// This forces Image component to remount and fetch fresh image
		const imageKey = useMemo(
			() => `avatar-${avatarUri}-${avatarETag || ''}-${avatar || ''}`,
			[avatarUri, avatarETag, avatar]
		);

		if ((!text && !avatar && !emoji && !rid) || !server) {
			return null;
		}

		const avatarAccessibilityLabel = accessibilityLabel ?? I18n.t('Avatar_Photo', { username: text });
		const avatarStyle = {
			width: size,
			height: size,
			borderRadius
		};

		let image;
		if (emoji) {
			image = (
				<MarkdownContext.Provider
					value={{
						getCustomEmoji
					}}>
					<Emoji
						block={{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: emoji }, shortCode: emoji }}
						style={avatarStyle}
						isAvatar={true}
					/>
				</MarkdownContext.Provider>
			);
		} else {
			image = (
				<Image
					key={imageKey}
					style={avatarStyle}
					source={{
						uri: avatarUri,
						headers: RocketChatSettings.customHeaders
					}}
					priority='high'
				/>
			);
		}

		if (onPress) {
			image = (
				<Touchable accessibilityLabel={avatarAccessibilityLabel} onPress={onPress}>
					{image}
				</Touchable>
			);
		}

		return (
			<View
				accessible
				accessibilityLabel={!onPress ? avatarAccessibilityLabel : undefined}
				style={[avatarStyle, style]}
				testID='avatar'>
				{image}
				{children}
			</View>
		);
	}
);

export default Avatar;
