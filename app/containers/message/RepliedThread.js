import React from 'react';
import { View, Text } from 'react-native';
import removeMarkdown from 'remove-markdown';
import { shortnameToUnicode } from 'emoji-toolkit';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import DisclosureIndicator from '../DisclosureIndicator';
import styles from './styles';

const RepliedThread = React.memo(({
	tmid, tmsg, isHeader, fetchThreadName, id
}) => {
	if (!tmid || !isHeader) {
		return null;
	}

	if (!tmsg) {
		fetchThreadName(tmid, id);
		return null;
	}

	let msg = shortnameToUnicode(tmsg);
	msg = removeMarkdown(msg);

	return (
		<View style={styles.repliedThread} testID={`message-thread-replied-on-${ msg }`}>
			<CustomIcon name='thread' size={20} style={styles.repliedThreadIcon} />
			<Text style={styles.repliedThreadName} numberOfLines={1}>{msg}</Text>
			<DisclosureIndicator />
		</View>
	);
}, (prevProps, nextProps) => {
	if (prevProps.tmid !== nextProps.tmid) {
		return false;
	}
	if (prevProps.tmsg !== nextProps.tmsg) {
		return false;
	}
	if (prevProps.isHeader !== nextProps.isHeader) {
		return false;
	}
	return true;
});

RepliedThread.propTypes = {
	tmid: PropTypes.string,
	tmsg: PropTypes.string,
	id: PropTypes.string,
	isHeader: PropTypes.bool,
	fetchThreadName: PropTypes.func
};
RepliedThread.displayName = 'MessageRepliedThread';

export default RepliedThread;
