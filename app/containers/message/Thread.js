import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { formatLastMessage, formatMessageCount, BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import { CustomIcon } from '../../lib/Icons';

const Thread = React.memo(({
	tcount, tlm, onThreadPress, msg
}) => {
	if (!tlm) {
		return null;
	}

	const time = formatLastMessage(tlm);
	const buttonText = formatMessageCount(tcount, 'thread');
	return (
		<View style={styles.buttonContainer}>
			{/* FIXME: Can we remove it? */}
			<Touchable
				onPress={onThreadPress}
				background={Touchable.Ripple('#fff')}
				style={[styles.button, styles.smallButton]}
				hitSlop={BUTTON_HIT_SLOP}
				testID={`message-thread-button-${ msg }`}
			>
				<React.Fragment>
					<CustomIcon name='thread' size={20} style={styles.buttonIcon} />
					<Text style={styles.buttonText}>{buttonText}</Text>
				</React.Fragment>
			</Touchable>
			<Text style={styles.time}>{time}</Text>
		</View>
	);
});

export default Thread;
