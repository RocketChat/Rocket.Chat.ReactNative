import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import Emoji from '../message/components/Emoji';
import { getAvatarURL } from '~/lib/methods/helpers/getAvatarUrl';
import { headers } from '~/lib/methods/helpers/fetch';
import { SubscriptionType } from '~/definitions/ISubscription';
import { type IAvatar } from './interfaces';
import I18n from '~/i18n';
import Touch from '../Touch';
import { AVATAR_BORDER_RADIUS } from './constants';
import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import sharedStyles from '~/views/Styles';

const styles = StyleSheet.create({
	emoji: {
		...sharedStyles.textRegular,
		textAlign: 'center',
		textAlignVertical: 'center'
	}
});

const AVATAR_EMOJI_FONT_SIZE = 30;

const Avatar = memo(
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
		borderRadius = AVATAR_BORDER_RADIUS,
		type = SubscriptionType.DIRECT,
		avatarExternalProviderUrl,
		roomAvatarExternalProviderUrl,
		cdnPrefix,
		accessibilityLabel,
		accessible = true
	}: IAvatar) => {
		const { colors } = useTheme();
		const { fontScaleLimited } = useResponsiveLayout();

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
			const emojiFontSize = AVATAR_EMOJI_FONT_SIZE * fontScaleLimited;
			image = (
				<Emoji
					content={emoji}
					standardEmojiStyle={[
						styles.emoji,
						{ color: colors.fontDefault, fontSize: emojiFontSize, lineHeight: emojiFontSize },
						avatarStyle
					]}
					customEmojiStyle={avatarStyle}
				/>
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
				<Image
					style={avatarStyle}
					source={{
						uri,
						headers: RocketChatSettings.customHeaders ?? headers
					}}
					priority='high'
				/>
			);
		}

		if (onPress) {
			image = (
				<Touch accessible={accessible} accessibilityLabel={avatarAccessibilityLabel} onPress={onPress}>
					{image}
				</Touch>
			);
		}

		return (
			<View
				accessible={accessible}
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
