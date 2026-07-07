import { Text, View } from 'react-native';

import MessageActionTouchable from './MessageActionTouchable';
import { CustomIcon } from '../../CustomIcon';
import styles from '../styles';
import { BUTTON_HIT_SLOP } from '../utils';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import { useMessageAuthor, useMessageItem } from '../stores/MessageStore';
import { useBroadcast, useMessageUser, useReplyBroadcast } from '../stores/MessageRoomStore';

const Broadcast = () => {
	'use memo';

	const item = useMessageItem();
	const user = useMessageUser();
	const replyBroadcast = useReplyBroadcast();
	const broadcast = useBroadcast();
	const { colors } = useTheme();
	const { u: author } = useMessageAuthor();
	const isOwn = author?._id === user?.id;

	if (broadcast && !isOwn) {
		return (
			<View style={styles.buttonContainer}>
				<MessageActionTouchable
					onPress={() => replyBroadcast?.(item)}
					style={[styles.button, { backgroundColor: colors.badgeBackgroundLevel2 }]}
					hitSlop={BUTTON_HIT_SLOP}
					testID='message-broadcast-reply'>
					<View style={styles.buttonInnerContainer}>
						<CustomIcon name='arrow-back' size={20} color={colors.fontWhite} />
						<Text style={[styles.buttonText, { color: colors.fontWhite }]}>{I18n.t('Reply')}</Text>
					</View>
				</MessageActionTouchable>
			</View>
		);
	}
	return null;
};

Broadcast.displayName = 'MessageBroadcast';

export default Broadcast;
