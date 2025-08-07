import React, { useContext } from 'react';
import { View } from 'react-native';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from './Context';
import { IMessageAvatar } from './interfaces';
import { SubscriptionType } from '../../definitions';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const MessageAvatar = React.memo(({ isHeader, avatar, author, small, navToRoomInfo, emoji, getCustomEmoji }: IMessageAvatar) => {
	const { user } = useContext(MessageContext);
	const { fontScaleLimited } = useResponsiveLayout();
	const smallSize = 20 * fontScaleLimited;
	const normalSize = 36 * fontScaleLimited;
	const size = small ? smallSize : normalSize;

	if (isHeader && author) {
		const onPress = () =>
			navToRoomInfo({
				t: SubscriptionType.DIRECT,
				rid: author._id,
				itsMe: author._id === user.id
			});

		return (
			<Avatar
				style={small ? styles.avatarSmall : styles.avatar}
				text={avatar ? '' : author.username}
				size={size}
				borderRadius={4}
				onPress={onPress}
				getCustomEmoji={getCustomEmoji}
				avatar={avatar}
				emoji={emoji}
			/>
		);
	}
	return <View style={[small ? styles.avatarSmall : styles.avatar, { width: size, height: size }]} />;
});

MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
