import { type ReactElement } from 'react';
import { View } from 'react-native';

import Avatar from '../../Avatar';
import styles from '../styles';
import { type IMessageAvatar } from '../interfaces';
import { SubscriptionType } from '../../../definitions';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useAvatar, useMessageField, useMessageGrouping } from '../stores/MessageStore';
import { useMessageUser, useNavToRoomInfoOverride } from '../stores/MessageRoomStore';
import { useRoomMessageHandlers } from '../hooks/useRoomMessageHandlers';

const AVATAR_BASE_SIZE = 36;

export const AvatarContainer = ({ children }: { children?: ReactElement | null }) => {
	const { fontScaleLimited } = useResponsiveLayout();
	const width = AVATAR_BASE_SIZE * fontScaleLimited;
	return <View style={{ width, alignItems: 'flex-end' }}>{children}</View>;
};

const MessageAvatar = ({ small }: IMessageAvatar) => {
	'use memo';

	const user = useMessageUser();
	const navToRoomInfoOverride = useNavToRoomInfoOverride();
	const { navToRoomInfo: selfSourcedNavToRoomInfo } = useRoomMessageHandlers({ optional: true }) ?? {};
	const navToRoomInfo = navToRoomInfoOverride ?? selfSourcedNavToRoomInfo;
	const { fontScaleLimited } = useResponsiveLayout();
	const { avatar, emoji } = useAvatar();
	const author = useMessageField(item => item.u);
	const isHeader = useMessageGrouping();
	const smallSize = 20 * fontScaleLimited;
	const normalSize = AVATAR_BASE_SIZE * fontScaleLimited;
	const size = small ? smallSize : normalSize;

	if (isHeader && author) {
		const onPress = () =>
			navToRoomInfo?.({
				t: SubscriptionType.DIRECT,
				rid: author._id,
				itsMe: author._id === user?.id
			});

		return (
			<AvatarContainer>
				<Avatar
					style={small ? undefined : styles.avatar}
					text={avatar ? '' : author.username}
					size={size}
					borderRadius={4}
					onPress={onPress}
					avatar={avatar}
					emoji={emoji}
				/>
			</AvatarContainer>
		);
	}
	return <AvatarContainer />;
};

export default MessageAvatar;
