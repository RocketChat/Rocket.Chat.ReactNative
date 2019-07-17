import React from 'react';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import { COLOR_DANGER } from '../../constants/colors';
import styles from './styles';
import { BUTTON_HIT_SLOP } from './utils';

const MessageError = React.memo(({ hasError, onErrorPress }) => {
	if (!hasError) {
		return null;
	}
	return (
		<Touchable onPress={onErrorPress} style={styles.errorButton} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='warning' color={COLOR_DANGER} size={18} />
		</Touchable>
	);
}, (prevProps, nextProps) => prevProps.hasError === nextProps.hasError);

MessageError.propTypes = {
	hasError: PropTypes.bool,
	onErrorPress: PropTypes.func
};
MessageError.displayName = 'MessageError';

export default MessageError;
