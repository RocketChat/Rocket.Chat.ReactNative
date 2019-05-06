import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { formatLastMessage, formatMessageCount, BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';

const Discussion = React.memo(({
	msg, dcount, dlm, onDiscussionPress
}) => {
	const time = formatLastMessage(dlm);
	const buttonText = formatMessageCount(dcount, 'discussion');
	return (
		<React.Fragment>
			<Text style={styles.startedDiscussion}>{I18n.t('Started_discussion')}</Text>
			<Text style={styles.text}>{msg}</Text>
			<View style={styles.buttonContainer}>
				<Touchable
					onPress={onDiscussionPress}
					background={Touchable.Ripple('#fff')}
					style={[styles.button, styles.smallButton]}
					hitSlop={BUTTON_HIT_SLOP}
				>
					<React.Fragment>
						<CustomIcon name='chat' size={20} style={styles.buttonIcon} />
						<Text style={styles.buttonText}>{buttonText}</Text>
					</React.Fragment>
				</Touchable>
				<Text style={styles.time}>{time}</Text>
			</View>
		</React.Fragment>
	);
});

export default Discussion;
