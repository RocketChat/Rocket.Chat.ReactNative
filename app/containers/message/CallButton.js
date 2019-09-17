import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { formatLastMessage, BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';

const CallButton = React.memo(({
	dlm, callJitsi
}) => {
	const time = formatLastMessage(dlm);
	return (
		<View style={styles.buttonContainer}>
			<Touchable
				onPress={callJitsi}
				background={Touchable.Ripple('#fff')}
				style={[styles.button, styles.smallButton]}
				hitSlop={BUTTON_HIT_SLOP}
			>
				<>
					<CustomIcon name='video' size={20} style={styles.buttonIcon} />
					<Text style={styles.buttonText}>{I18n.t('Click_to_join')}</Text>
				</>
			</Touchable>
			<Text style={styles.time}>{time}</Text>
		</View>
	);
});

CallButton.propTypes = {
	dlm: PropTypes.string,
	callJitsi: PropTypes.func
};
CallButton.displayName = 'CallButton';

export default CallButton;
