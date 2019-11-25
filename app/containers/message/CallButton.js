import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { formatLastMessage, BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';

const CallButton = React.memo(({
	dlm, theme, callJitsi
}) => {
	const time = formatLastMessage(dlm);
	return (
		<View style={styles.buttonContainer}>
			<Touchable
				onPress={callJitsi}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
				style={[styles.button, styles.smallButton, { backgroundColor: themes[theme].tintColor }]}
				hitSlop={BUTTON_HIT_SLOP}
			>
				<>
					<CustomIcon name='video' size={20} style={styles.buttonIcon} color={themes[theme].buttonText} />
					<Text style={[styles.buttonText, { color: themes[theme].buttonText }]}>{I18n.t('Click_to_join')}</Text>
				</>
			</Touchable>
			<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
		</View>
	);
});

CallButton.propTypes = {
	dlm: PropTypes.string,
	theme: PropTypes.string,
	callJitsi: PropTypes.func
};
CallButton.displayName = 'CallButton';

export default CallButton;
