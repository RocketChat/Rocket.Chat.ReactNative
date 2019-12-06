import React from 'react';
import { View, Text } from 'react-native';
import removeMarkdown from 'remove-markdown';
import PropTypes from 'prop-types';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import { CustomIcon } from '../../lib/Icons';
import DisclosureIndicator from '../DisclosureIndicator';
import styles from './styles';
import { themes } from '../../constants/colors';

const RepliedThread = React.memo(({
	tmid, tmsg, isHeader, fetchThreadName, id, theme
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
			<CustomIcon name='thread' size={20} style={styles.repliedThreadIcon} color={themes[theme].tintColor} />
			<Text style={[styles.repliedThreadName, { color: themes[theme].tintColor }]} numberOfLines={1}>{msg}</Text>
			<DisclosureIndicator theme={theme} />
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
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	return true;
});

RepliedThread.propTypes = {
	tmid: PropTypes.string,
	tmsg: PropTypes.string,
	id: PropTypes.string,
	isHeader: PropTypes.bool,
	theme: PropTypes.string,
	fetchThreadName: PropTypes.func
};
RepliedThread.displayName = 'MessageRepliedThread';

export default RepliedThread;
