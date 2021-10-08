import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import Touchable from './Touchable';
import { E2E_MESSAGE_TYPE } from '../../lib/encryption/constants';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import { BUTTON_HIT_SLOP } from './utils';
import MessageContext from './Context';
import styles from './styles';

const Encrypted = React.memo(({ type, theme }) => {
	if (type !== E2E_MESSAGE_TYPE) {
		return null;
	}

	const { onEncryptedPress } = useContext(MessageContext);
	return (
		<Touchable onPress={onEncryptedPress} style={styles.encrypted} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='encrypted' size={16} color={themes[theme].auxiliaryText} />
		</Touchable>
	);
});
Encrypted.propTypes = {
	type: PropTypes.string,
	theme: PropTypes.string
};

export default Encrypted;
