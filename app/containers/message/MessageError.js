import React from 'react';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { BUTTON_HIT_SLOP } from './utils';
import { themes } from '../../constants/colors';

const MessageError = React.memo(({ hasError, onErrorPress, theme }) => {
	if (!hasError) {
		return null;
	}
	return (
		<Touchable onPress={onErrorPress} style={styles.errorButton} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='warning' color={themes[theme].dangerColor} size={18} />
		</Touchable>
	);
}, (prevProps, nextProps) => prevProps.hasError === nextProps.hasError && prevProps.theme === nextProps.theme);

MessageError.propTypes = {
	hasError: PropTypes.bool,
	onErrorPress: PropTypes.func,
	theme: PropTypes.string
};
MessageError.displayName = 'MessageError';

export default MessageError;
