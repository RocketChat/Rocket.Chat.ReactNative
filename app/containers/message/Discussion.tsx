import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import Touchable from './Touchable';
import { BUTTON_HIT_SLOP, formatMessageCount } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { DISCUSSION } from './constants';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import { formatDateThreads } from '../../lib/methods/helpers/room';
import { IMessage } from '../../definitions';
import { useTheme } from '../../theme';

const Discussion = React.memo(
	({ msg, dcount, dlm }: Pick<IMessage, 'msg' | 'dcount' | 'dlm'>) => {
		const { theme } = useTheme();
		let time;
		if (dlm) {
			time = formatDateThreads(dlm);
		}
		const buttonText = formatMessageCount(dcount, DISCUSSION);
		const { onDiscussionPress } = useContext(MessageContext);
		return (
			<>
				<Text style={[styles.startedDiscussion, { color: themes[theme].fontSecondaryInfo }]}>{I18n.t('Started_discussion')}</Text>
				<Text style={[styles.text, { color: themes[theme].fontDefault }]}>{msg}</Text>
				<View style={styles.buttonContainer}>
					<Touchable
						onPress={onDiscussionPress}
						background={Touchable.Ripple(themes[theme].surfaceNeutral)}
						style={[styles.button, { backgroundColor: themes[theme].badgeBackgroundLevel2 }]}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<>
							<CustomIcon name='discussions' size={16} style={styles.buttonIcon} color={themes[theme].fontWhite} />
							<Text style={[styles.buttonText, { color: themes[theme].fontWhite }]}>{buttonText}</Text>
						</>
					</Touchable>
					<Text style={[styles.time, { color: themes[theme].fontSecondaryInfo }]}>{time}</Text>
				</View>
			</>
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
