import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';
import MessageContext from './Context';
import ThreadDetails from '../ThreadDetails';
import I18n from '../../i18n';

const Thread = React.memo(({
	msg, tcount, tlm, isThreadRoom, theme, id
}) => {
	if (!tlm || isThreadRoom || tcount === 0) {
		return null;
	}

	const {
		threadBadgeColor, toggleFollowThread, user, replies
	} = useContext(MessageContext);
	return (
		<View style={styles.buttonContainer}>
			<View
				style={[styles.button, { backgroundColor: themes[theme].tintColor }]}
				testID={`message-thread-button-${ msg }`}
			>
				<Text style={[styles.buttonText, { color: themes[theme].buttonText }]}>{I18n.t('Reply')}</Text>
			</View>
			<ThreadDetails
				item={{
					tcount,
					replies,
					tlm,
					id
				}}
				user={user}
				badgeColor={threadBadgeColor}
				toggleFollowThread={toggleFollowThread}
				style={styles.threadDetails}
			/>
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
