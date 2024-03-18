import React from 'react';
import { Text, View } from 'react-native';

import Touchable from './Touchable';
import { BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { themes } from '../../lib/constants';
import { IMessageCallButton } from './interfaces';
import { useTheme } from '../../theme';

const CallButton = React.memo(({ handleEnterCall }: IMessageCallButton) => {
	const { theme } = useTheme();
	return (
		<View style={styles.buttonContainer}>
			<Touchable
				onPress={handleEnterCall}
				background={Touchable.Ripple(themes[theme].surfaceNeutral)}
				style={[styles.button, { backgroundColor: themes[theme].badgeBackgroundLevel2 }]}
				hitSlop={BUTTON_HIT_SLOP}
			>
				<>
					<CustomIcon name='camera' size={16} style={styles.buttonIcon} color={themes[theme].fontWhite} />
					<Text style={[styles.buttonText, { color: themes[theme].fontWhite }]}>{I18n.t('Click_to_join')}</Text>
				</>
			</Touchable>
		</View>
	);
});

CallButton.displayName = 'CallButton';

export default CallButton;
