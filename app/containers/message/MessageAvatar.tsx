import React, { ReactElement, useContext } from 'react';
import { View } from 'react-native';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from './Context';
import { IMessageAvatar } from './interfaces';
import { SubscriptionType } from '../../definitions';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const AVATAR_BASE_SIZE = 36;

export const AvatarContainer = ({ children }: { children?: ReactElement | null }) => {
	const { fontScaleLimited } = useResponsiveLayout();
	const width = AVATAR_BASE_SIZE * fontScaleLimited;
	return <View style={{ width, alignItems: 'flex-end' }}>{children}</View>;
};

const MessageAvatar = React.memo(({ isHeader, avatar, author, small, navToRoomInfo, emoji, getCustomEmoji }: IMessageAvatar) => {
	'use memo';

	const { user } = useContext(MessageContext);
	const { fontScaleLimited } = useResponsiveLayout();
	const smallSize = 20 * fontScaleLimited;
	const normalSize = AVATAR_BASE_SIZE * fontScaleLimited;
	const size = small ? smallSize : normalSize;

	if (isHeader && author) {
		const onPress = () =>
			navToRoomInfo({
				t: SubscriptionType.DIRECT,
				rid: author._id,
				itsMe: author._id === user.id
			});

		return (
			<AvatarContainer>
				<Avatar
					style={small ? undefined : styles.avatar}
					text={avatar ? '' : author.username}
					size={size}
					borderRadius={4}
					onPress={onPress}
					getCustomEmoji={getCustomEmoji}
					avatar={avatar}
					emoji={emoji}
				/>
			</AvatarContainer>
		);
	}
	return <AvatarContainer />;
});

MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
