import { Text, View } from 'react-native';

import MessageActionTouchable from './Touchable/MessageActionTouchable';
import { BUTTON_HIT_SLOP } from '../utils';
import styles from '../styles';
import I18n from '../../../i18n';
import { CustomIcon } from '../../CustomIcon';
import { useTheme } from '../../../theme';
import { useRoomMessageHandlers } from '../hooks/useRoomMessageHandlers';

const CallButton = () => {
	'use memo';

	const { handleEnterCall } = useRoomMessageHandlers({ optional: true }) ?? {};
	const { colors } = useTheme();
	return (
		<View style={styles.buttonContainer}>
			<MessageActionTouchable
				onPress={handleEnterCall}
				style={[styles.button, { backgroundColor: colors.badgeBackgroundLevel2 }]}
				hitSlop={BUTTON_HIT_SLOP}>
				<View style={styles.buttonInnerContainer}>
					<CustomIcon name='video' size={16} color={colors.fontWhite} />
					<Text style={[styles.buttonText, { color: colors.fontWhite }]}>{I18n.t('Click_to_join')}</Text>
				</View>
			</MessageActionTouchable>
		</View>
	);
};

export default CallButton;
