import { Text, View } from 'react-native';

import MessageActionTouchable from './Touchable/MessageActionTouchable';
import { BUTTON_HIT_SLOP, formatMessageCount } from '../utils';
import styles from '../styles';
import I18n from '../../../i18n';
import { CustomIcon } from '../../CustomIcon';
import { DISCUSSION } from '../constants';
import { formatDateThreads } from '../../../lib/methods/helpers/room';
import { useTheme } from '../../../theme';
import { useDiscussion, useMessageField, useMessageText } from '../stores/MessageStore';
import { useOnDiscussionPress } from '../stores/MessageRoomStore';

const Discussion = () => {
	'use memo';

	const { colors } = useTheme();
	const drid = useMessageField(item => item.drid);
	const { dcount, dlm } = useDiscussion();
	const { messageText } = useMessageText();
	let time;
	if (dlm) {
		time = formatDateThreads(dlm);
	}
	const buttonText = formatMessageCount(dcount, DISCUSSION);
	const onDiscussionPress = useOnDiscussionPress();
	return (
		<View style={{ gap: 4 }}>
			<Text style={[styles.startedDiscussion, { color: colors.fontSecondaryInfo }]}>{I18n.t('Started_discussion')}</Text>
			<Text style={[styles.discussionText, { color: colors.fontDefault }]}>{messageText}</Text>
			<View style={[styles.buttonContainer, { gap: 8 }]}>
				<MessageActionTouchable
					onPress={() => onDiscussionPress?.(drid)}
					style={[styles.button, { backgroundColor: colors.badgeBackgroundLevel2 }]}
					hitSlop={BUTTON_HIT_SLOP}>
					<View style={styles.buttonInnerContainer}>
						<CustomIcon name='discussions' size={16} color={colors.fontWhite} />
						<Text style={[styles.buttonText, { color: colors.fontWhite }]}>{buttonText}</Text>
					</View>
				</MessageActionTouchable>
				<Text style={[styles.time, { color: colors.fontSecondaryInfo }]}>{time}</Text>
			</View>
		</View>
	);
};

export default Discussion;
