import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import styles from './styles';
import MessageContext from './Context';
import ThreadDetails from '../ThreadDetails';
import i18n from '../../i18n';
import { IMessageThread } from './interfaces';
import { useTheme } from '../../theme';

const Thread = React.memo(
	({ msg, tcount, tlm, isThreadRoom, id }: IMessageThread) => {
		const { theme, colors } = useTheme();
		const { threadBadgeColor, toggleFollowThread, user, replies } = useContext(MessageContext);

		const backgroundColor = threadBadgeColor ? colors.badgeBackgroundLevel2 : colors.buttonBackgroundSecondaryDefault;
		const textColor = threadBadgeColor || theme !== 'light' ? colors.fontWhite : colors.fontPureBlack;

		if (!tlm || isThreadRoom || tcount === null) {
			return null;
		}

		return (
			<View style={styles.buttonContainer}>
				<View style={[styles.button, { backgroundColor }]} testID={`message-thread-button-${msg}`}>
					<Text style={[styles.buttonText, { color: textColor }]}>{i18n.t('View_Thread')}</Text>
				</View>
				<ThreadDetails
					item={{
						tcount,
						replies,
						id
					}}
					user={user}
					badgeColor={threadBadgeColor}
					toggleFollowThread={toggleFollowThread}
					style={styles.threadDetails}
				/>
			</View>
		);
	},
	(prevProps, nextProps) => {
		if (prevProps.tcount !== nextProps.tcount) {
			return false;
		}
		return true;
	}
);

Thread.displayName = 'MessageThread';

export default Thread;
