import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import Touchable from './Touchable';
import { BUTTON_HIT_SLOP, formatMessageCount } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { DISCUSSION } from './constants';
import MessageContext from './Context';
import { formatDateThreads } from '../../lib/methods/helpers/room';
import { type IMessage } from '../../definitions';
import { useTheme } from '../../theme';

// TODO: Create a reusable button component for message
const Discussion = React.memo(
	({ msg, dcount, dlm }: Pick<IMessage, 'msg' | 'dcount' | 'dlm'>) => {
		'use memo';

		const { colors } = useTheme();
		let time;
		if (dlm) {
			time = formatDateThreads(dlm);
		}
		const buttonText = formatMessageCount(dcount, DISCUSSION);
		const { onDiscussionPress } = useContext(MessageContext);
		return (
			<View style={{ gap: 4 }}>
				<Text style={[styles.startedDiscussion, { color: colors.fontSecondaryInfo }]}>{I18n.t('Started_discussion')}</Text>
				<Text style={[styles.discussionText, { color: colors.fontDefault }]}>{msg}</Text>
				<View style={[styles.buttonContainer, { gap: 8 }]}>
					<Touchable
						onPress={onDiscussionPress}
						background={Touchable.Ripple(colors.surfaceNeutral)}
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
	},
	(prevProps, nextProps) => {
		if (prevProps.msg !== nextProps.msg) {
			return false;
		}
		if (prevProps.dcount !== nextProps.dcount) {
			return false;
		}
		if (prevProps.dlm !== nextProps.dlm) {
			return false;
		}
		return true;
	}
);

Discussion.displayName = 'MessageDiscussion';

export default Discussion;
