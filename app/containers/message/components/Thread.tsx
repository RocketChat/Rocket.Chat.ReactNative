import { Text, View } from 'react-native';

import styles from '../styles';
import ThreadDetails from '../../ThreadDetails';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import Touchable from './Touchable';
import { useMessageItem, useMessageText, useReplies, useThreadBadgeColor, useThreadData } from '../stores/MessageStore';
import { useIsThreadRoom, useMessageUser, useOnThreadPress, useToggleFollowThread } from '../stores/MessageRoomStore';

const Thread = () => {
	'use memo';

	const { theme, colors } = useTheme();
	const item = useMessageItem();
	const isThreadRoom = useIsThreadRoom();
	const threadBadgeColor = useThreadBadgeColor();
	const toggleFollowThread = useToggleFollowThread();
	const user = useMessageUser();
	const replies = useReplies();
	const onThreadPress = useOnThreadPress();
	const { tcount, tlm, id } = useThreadData();
	const { messageText } = useMessageText();

	const backgroundColor = threadBadgeColor ? colors.badgeBackgroundLevel2 : colors.buttonBackgroundSecondaryDefault;
	const textColor = threadBadgeColor || theme !== 'light' ? colors.fontWhite : colors.fontPureBlack;

	if (!tlm || isThreadRoom || tcount === null) {
		return null;
	}

	return (
		<View style={styles.buttonContainer}>
			<Touchable
				onPress={() => onThreadPress?.(item)}
				accessibilityRole='button'
				accessibilityLabel={I18n.t('View_Thread')}
				style={[styles.button, { backgroundColor }]}
				testID={`message-thread-button-${messageText}`}>
				<Text style={[styles.buttonText, { color: textColor }]}>{I18n.t('View_Thread')}</Text>
			</Touchable>
			<ThreadDetails
				item={{
					tcount,
					replies,
					id
				}}
				user={{ id: user?.id ?? '' }}
				badgeColor={threadBadgeColor}
				toggleFollowThread={toggleFollowThread}
				style={styles.threadDetails}
			/>
		</View>
	);
};

Thread.displayName = 'MessageThread';

export default Thread;
