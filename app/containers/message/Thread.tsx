import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import styles from './styles';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import ThreadDetails from '../ThreadDetails';
import I18n from '../../i18n';
import { IMessageThread } from './interfaces';
import { useTheme } from '../../theme';

const Thread = React.memo(
	({ msg, tcount, tlm, isThreadRoom, id }: IMessageThread) => {
		const { theme } = useTheme();
		const { threadBadgeColor, toggleFollowThread, user, replies } = useContext(MessageContext);

		if (!tlm || isThreadRoom || tcount === null) {
			return null;
		}

		return (
			<View style={styles.buttonContainer}>
				<View
					style={[styles.button, { backgroundColor: themes[theme].badgeBackgroundLevel2 }]}
					testID={`message-thread-button-${msg}`}
				>
					<Text style={[styles.buttonText, { color: themes[theme].fontWhite }]}>{I18n.t('Reply')}</Text>
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
