import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';

import { formatMessageCount } from './utils';
import styles from './styles';
import { CustomIcon } from '../../lib/Icons';
import { THREAD } from './constants';
import { themes } from '../../constants/colors';
import { formatDateThreads } from '../../utils/room';
import MessageContext from './Context';

const Thread = React.memo(({
	msg, tcount, tlm, isThreadRoom, theme, id
}) => {
	if (!tlm || isThreadRoom || tcount === 0) {
		return null;
	}

	const {
		getBadgeColor, toggleFollowThread, user, replies
	} = useContext(MessageContext);
	const time = formatDateThreads(tlm);
	const buttonText = formatMessageCount(tcount, THREAD);
	const badgeColor = getBadgeColor(id);
	const isFollowing = replies?.find(u => u === user.id);
	return (
		<View style={styles.buttonContainer}>
			<View
				style={[styles.button, { backgroundColor: themes[theme].tintColor }]}
				testID={`message-thread-button-${ msg }`}
			>
				<CustomIcon name='threads' size={16} style={[styles.buttonIcon, { color: themes[theme].buttonText }]} />
				<Text style={[styles.buttonText, { color: themes[theme].buttonText }]}>{buttonText}</Text>
			</View>
			<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
			{badgeColor ? <View style={[styles.threadBadge, { backgroundColor: badgeColor }]} /> : null}
			<Touchable onPress={() => toggleFollowThread(isFollowing, id)}>
				<CustomIcon
					name={isFollowing ? 'notification' : 'notification-disabled'}
					size={24}
					color={themes[theme].auxiliaryText}
					style={styles.threadBell}
				/>
			</Touchable>
		</View>
	);
}, (prevProps, nextProps) => {
	if (prevProps.tcount !== nextProps.tcount) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	return true;
});

Thread.propTypes = {
	msg: PropTypes.string,
	tcount: PropTypes.string,
	theme: PropTypes.string,
	tlm: PropTypes.string,
	isThreadRoom: PropTypes.bool,
	id: PropTypes.string
};
Thread.displayName = 'MessageThread';

export default Thread;
