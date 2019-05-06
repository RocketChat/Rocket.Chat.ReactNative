import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { BUTTON_HIT_SLOP } from './utils';
import I18n from '../../i18n';

const Broadcast = React.memo(({
	author, user, broadcast, replyBroadcast
}) => {
	const isOwn = author._id === user.id;
	if (broadcast && !isOwn) {
		return (
			<View style={styles.buttonContainer}>
				<Touchable
					onPress={replyBroadcast}
					background={Touchable.Ripple('#fff')}
					style={styles.button}
					hitSlop={BUTTON_HIT_SLOP}
				>
					<React.Fragment>
						<CustomIcon name='back' size={20} style={styles.buttonIcon} />
						<Text style={styles.buttonText}>{I18n.t('Reply')}</Text>
					</React.Fragment>
				</Touchable>
			</View>
		);
	}
	return null;
});

export default Broadcast;
