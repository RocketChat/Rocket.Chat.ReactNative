import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { formatLastMessage, BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import callJitsi from '../../lib/methods/callJitsi';

const CallButton = React.memo(({
	dlm, rid
}) => {
	const time = formatLastMessage(dlm);
	return (
		<React.Fragment>
			<View style={styles.buttonContainer}>
				<Touchable
					onPress={() => callJitsi(rid, false)}
					background={Touchable.Ripple('#fff')}
					style={[styles.button, styles.smallButton]}
					hitSlop={BUTTON_HIT_SLOP}
				>
					<React.Fragment>
						<CustomIcon name='video' size={20} style={styles.buttonIcon} />
						<Text style={styles.buttonText}>{I18n.t('Click_to_join')}</Text>
					</React.Fragment>
				</Touchable>
				<Text style={styles.time}>{time}</Text>
			</View>
		</React.Fragment>
	);
});

CallButton.propTypes = {
	dlm: PropTypes.string,
	rid: PropTypes.string
};
CallButton.displayName = 'CallButton';

export default CallButton;
