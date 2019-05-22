import React from 'react';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import { COLOR_DANGER } from '../../constants/colors';
import styles from './styles';

const MessageError = React.memo(({ hasError, onErrorPress }) => {
	if (!hasError) {
		return null;
	}
	return (
		<Touchable onPress={onErrorPress} style={styles.errorButton}>
			<CustomIcon name='circle-cross' color={COLOR_DANGER} size={20} />
		</Touchable>
	);
}, (prevProps, nextProps) => prevProps.hasError === nextProps.hasError);

MessageError.propTypes = {
	hasError: PropTypes.bool,
	onErrorPress: PropTypes.func
};
MessageError.displayName = 'MessageError';

export default MessageError;
