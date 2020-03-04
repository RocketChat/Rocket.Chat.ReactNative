import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { BUTTON_HIT_SLOP } from './utils';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';

const Broadcast = React.memo(({
	author, user, broadcast, replyBroadcast, theme
}) => {
	const isOwn = author._id === user.id;
	if (broadcast && !isOwn) {
		return (
			<View style={styles.buttonContainer}>
				<Touchable
					onPress={replyBroadcast}
					background={Touchable.Ripple(themes[theme].bannerBackground)}
					style={[styles.button, { backgroundColor: themes[theme].tintColor }]}
					hitSlop={BUTTON_HIT_SLOP}
					testID='message-broadcast-reply'
				>
					<>
						<CustomIcon name='back' size={20} style={styles.buttonIcon} color={themes[theme].buttonText} />
						<Text style={[styles.buttonText, { color: themes[theme].buttonText }]}>{I18n.t('Reply')}</Text>
					</>
				</Touchable>
			</View>
		);
	}
	return null;
});

Broadcast.propTypes = {
	author: PropTypes.object,
	user: PropTypes.object,
	broadcast: PropTypes.bool,
	theme: PropTypes.string,
	replyBroadcast: PropTypes.func
};
Broadcast.displayName = 'MessageBroadcast';

export default Broadcast;
