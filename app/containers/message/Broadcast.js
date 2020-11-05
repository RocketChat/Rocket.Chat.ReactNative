import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import Touchable from './Touchable';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { BUTTON_HIT_SLOP } from './utils';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import MessageContext from './Context';

const Broadcast = React.memo(({
	author, broadcast, theme
}) => {
	const { user, replyBroadcast } = useContext(MessageContext);
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
						<CustomIcon name='arrow-back' size={20} style={styles.buttonIcon} color={themes[theme].buttonText} />
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
	broadcast: PropTypes.bool,
	theme: PropTypes.string
};
Broadcast.displayName = 'MessageBroadcast';

export default Broadcast;
