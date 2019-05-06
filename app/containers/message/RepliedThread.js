import React from 'react';
import { View, Text } from 'react-native';
import removeMarkdown from 'remove-markdown';
import { emojify } from 'react-emojione';

import { CustomIcon } from '../../lib/Icons';
import DisclosureIndicator from '../DisclosureIndicator';
import styles from './styles';

const RepliedThread = React.memo(({
	status, tmid, tmsg, header, isTemp, fetchThreadName
}) => {
	if (!tmid || !header || isTemp) {
		return null;
	}

	if (!tmsg) {
		fetchThreadName(tmid);
		return null;
	}

	let msg = emojify(tmsg, { output: 'unicode' });
	msg = removeMarkdown(msg);

	return (
		<View style={styles.repliedThread} testID={`message-thread-replied-on-${ msg }`}>
			<CustomIcon name='thread' size={20} style={styles.repliedThreadIcon} />
			<Text style={styles.repliedThreadName} numberOfLines={1}>{msg}</Text>
			<DisclosureIndicator />
		</View>
	);
});

export default RepliedThread;
