import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import Touchable from './Touchable';
import { formatMessageCount, BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import { DISCUSSION } from './constants';
import { themes } from '../../constants/colors';
import MessageContext from './Context';
import { formatDateThreads } from '../../utils/room';

const Discussion = React.memo(({
	msg, dcount, dlm, theme
}) => {
	let time;
	if (dlm) {
		time = formatDateThreads(dlm);
	}
	const buttonText = formatMessageCount(dcount, DISCUSSION);
	const { onDiscussionPress } = useContext(MessageContext);
	return (
		<>
			<Text style={[styles.startedDiscussion, { color: themes[theme].auxiliaryText }]}>{I18n.t('Started_discussion')}</Text>
			<Text style={[styles.text, { color: themes[theme].bodyText }]}>{msg}</Text>
			<View style={styles.buttonContainer}>
				<Touchable
					onPress={onDiscussionPress}
					background={Touchable.Ripple(themes[theme].bannerBackground)}
					style={[styles.button, { backgroundColor: themes[theme].tintColor }]}
					hitSlop={BUTTON_HIT_SLOP}
				>
					<>
						<CustomIcon name='discussions' size={16} style={styles.buttonIcon} color={themes[theme].buttonText} />
						<Text style={[styles.buttonText, { color: themes[theme].buttonText }]}>{buttonText}</Text>
					</>
				</Touchable>
				<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
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
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	return true;
});

Discussion.propTypes = {
	msg: PropTypes.string,
	dcount: PropTypes.number,
	dlm: PropTypes.string,
	theme: PropTypes.string
};
Discussion.displayName = 'MessageDiscussion';

export default Discussion;
