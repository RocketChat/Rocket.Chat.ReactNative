import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { formatLastMessage, formatMessageCount, BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import { DISCUSSION } from './constants';

const Discussion = React.memo(({
	msg, dcount, dlm, onDiscussionPress
}) => {
	const time = formatLastMessage(dlm);
	const buttonText = formatMessageCount(dcount, DISCUSSION);
	return (
		<>
			<Text style={styles.startedDiscussion}>{I18n.t('Started_discussion')}</Text>
			<Text style={styles.text}>{msg}</Text>
			<View style={styles.buttonContainer}>
				<Touchable
					onPress={onDiscussionPress}
					background={Touchable.Ripple('#fff')}
					style={[styles.button, styles.smallButton]}
					hitSlop={BUTTON_HIT_SLOP}
				>
					<>
						<CustomIcon name='chat' size={20} style={styles.buttonIcon} />
						<Text style={styles.buttonText}>{buttonText}</Text>
					</>
				</Touchable>
				<Text style={styles.time}>{time}</Text>
			</View>
		</>
	);
}, (prevProps, nextProps) => {
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
});

Discussion.propTypes = {
	msg: PropTypes.string,
	dcount: PropTypes.number,
	dlm: PropTypes.string,
	onDiscussionPress: PropTypes.func
};
Discussion.displayName = 'MessageDiscussion';

export default Discussion;
