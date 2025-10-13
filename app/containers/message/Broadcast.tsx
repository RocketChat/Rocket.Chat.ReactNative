import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import Touchable from './Touchable';
import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import { BUTTON_HIT_SLOP } from './utils';
import I18n from '../../i18n';
import { themes } from '../../lib/constants/colors';
import MessageContext from './Context';
import { IMessageBroadcast } from './interfaces';
import { useTheme } from '../../theme';

// TODO: Create a reusable button component for message
const Broadcast = React.memo(({ author, broadcast }: IMessageBroadcast) => {
	'use memo';

	const { user, replyBroadcast } = useContext(MessageContext);
	const { theme } = useTheme();
	const isOwn = author?._id === user.id;

	if (broadcast && !isOwn) {
		return (
			<View style={styles.buttonContainer}>
				<Touchable
					onPress={replyBroadcast}
					background={Touchable.Ripple(themes[theme].surfaceNeutral)}
					style={[styles.button, { backgroundColor: themes[theme].badgeBackgroundLevel2 }]}
					hitSlop={BUTTON_HIT_SLOP}
					testID='message-broadcast-reply'>
					<View style={styles.buttonInnerContainer}>
						<CustomIcon name='arrow-back' size={20} color={themes[theme].fontWhite} />
						<Text style={[styles.buttonText, { color: themes[theme].fontWhite }]}>{I18n.t('Reply')}</Text>
					</View>
				</Touchable>
			</View>
		);
	}
	return null;
});

Broadcast.displayName = 'MessageBroadcast';

export default Broadcast;
