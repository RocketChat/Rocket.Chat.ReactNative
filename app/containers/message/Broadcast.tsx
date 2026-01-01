import React, { useContext } from 'react';
import { Text, View } from 'react-native';

import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import { BUTTON_HIT_SLOP } from './utils';
import I18n from '../../i18n';
import { themes } from '../../lib/constants/colors';
import MessageContext from './Context';
import { type IMessageBroadcast } from './interfaces';
import { useTheme } from '../../theme';
import PressableOpacity from '../PressableOpacity';

// TODO: Create a reusable button component for message
const Broadcast = React.memo(({ author, broadcast }: IMessageBroadcast) => {
	'use memo';

	const { user, replyBroadcast } = useContext(MessageContext);
	const { theme } = useTheme();
	const isOwn = author?._id === user.id;

	if (broadcast && !isOwn) {
		return (
			<View style={styles.buttonContainer}>
				<PressableOpacity
					onPress={replyBroadcast}
					style={[styles.button, { backgroundColor: themes[theme].badgeBackgroundLevel2 }]}
					hitSlop={BUTTON_HIT_SLOP}
					testID='message-broadcast-reply'
					android_ripple={{
						// color: themes[theme].surfaceNeutral		// this color was used previously but the buttonPrimaryPress will better to match tint of currently used color as they have similar tint
						color: themes[theme].buttonBackgroundPrimaryPress
					}}
					disableOpacityOnAndroid>
					<View style={styles.buttonInnerContainer}>
						<CustomIcon name='arrow-back' size={20} color={themes[theme].fontWhite} />
						<Text style={[styles.buttonText, { color: themes[theme].fontWhite }]}>{I18n.t('Reply')}</Text>
					</View>
				</PressableOpacity>
			</View>
		);
	}
	return null;
});

Broadcast.displayName = 'MessageBroadcast';

export default Broadcast;
