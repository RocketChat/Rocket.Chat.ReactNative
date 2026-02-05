import React from 'react';
import { Text, View } from 'react-native';

import { BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { themes } from '../../lib/constants/colors';
import { type IMessageCallButton } from './interfaces';
import { useTheme } from '../../theme';
import PressableOpacity from '../PressableOpacity';

// TODO: Create a reusable button component for message
const CallButton = React.memo(({ handleEnterCall }: IMessageCallButton) => {
	'use memo';

	const { theme } = useTheme();
	return (
		<View style={styles.buttonContainer}>
			<PressableOpacity
				onPress={handleEnterCall}
				style={[styles.button, { backgroundColor: themes[theme].badgeBackgroundLevel2 }]}
				hitSlop={BUTTON_HIT_SLOP}
				android_ripple={{
					color: themes[theme].buttonBackgroundPrimaryPress
				}}
				disableOpacityOnAndroid>
				<View style={styles.buttonInnerContainer}>
					<CustomIcon name='camera' size={16} color={themes[theme].fontWhite} />
					<Text style={[styles.buttonText, { color: themes[theme].fontWhite }]}>{I18n.t('Click_to_join')}</Text>
				</View>
			</PressableOpacity>
		</View>
	);
});

CallButton.displayName = 'CallButton';

export default CallButton;
