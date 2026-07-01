import { useContext } from 'react';
import { Text, View } from 'react-native';

import Touchable from './Touchable';
import { BUTTON_HIT_SLOP, formatMessageCount } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { DISCUSSION } from './constants';
import MessageContext from './Context';
import { formatDateThreads } from '../../lib/methods/helpers/room';
import { useTheme } from '../../theme';
import { useDiscussion, useMessageText } from './MessageStore';

// TODO: Create a reusable button component for message
const Discussion = () => {
	'use memo';

	const { colors } = useTheme();
	const { dcount, dlm } = useDiscussion();
	const { messageText } = useMessageText();
	let time;
	if (dlm) {
		time = formatDateThreads(dlm);
	}
	const buttonText = formatMessageCount(dcount, DISCUSSION);
	const { onDiscussionPress } = useContext(MessageContext);
	return (
		<View style={{ gap: 4 }}>
			<Text style={[styles.startedDiscussion, { color: colors.fontSecondaryInfo }]}>{I18n.t('Started_discussion')}</Text>
			<Text style={[styles.discussionText, { color: colors.fontDefault }]}>{messageText}</Text>
			<View style={[styles.buttonContainer, { gap: 8 }]}>
				<Touchable
					onPress={onDiscussionPress}
					style={[styles.button, { backgroundColor: colors.badgeBackgroundLevel2 }]}
					hitSlop={BUTTON_HIT_SLOP}>
					<View style={styles.buttonInnerContainer}>
						<CustomIcon name='discussions' size={16} color={colors.fontWhite} />
						<Text style={[styles.buttonText, { color: colors.fontWhite }]}>{buttonText}</Text>
					</View>
				</Touchable>
				<Text style={[styles.time, { color: colors.fontSecondaryInfo }]}>{time}</Text>
			</View>
		</View>
	);
};

Discussion.displayName = 'MessageDiscussion';

export default Discussion;
