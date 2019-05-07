import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import { formatLastMessage, formatMessageCount } from './utils';
import styles from './styles';
import { CustomIcon } from '../../lib/Icons';

const Thread = React.memo(({
	msg, tcount, tlm
}) => {
	if (!tlm) {
		return null;
	}

	const time = formatLastMessage(tlm);
	const buttonText = formatMessageCount(tcount, 'thread');
	return (
		<View style={styles.buttonContainer}>
			<View
				style={[styles.button, styles.smallButton]}
				testID={`message-thread-button-${ msg }`}
			>
				<CustomIcon name='thread' size={20} style={styles.buttonIcon} />
				<Text style={styles.buttonText}>{buttonText}</Text>
			</View>
			<Text style={styles.time}>{time}</Text>
		</View>
	);
}, (prevProps, nextProps) => {
	if (prevProps.tcount !== nextProps.tcount) {
		return false;
	}
	return true;
});

Thread.propTypes = {
	msg: PropTypes.string,
	tcount: PropTypes.string,
	tlm: PropTypes.string
};
Thread.displayName = 'MessageThread';

export default Thread;
