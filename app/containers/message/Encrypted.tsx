import React, { useContext } from 'react';

import Touchable from './Touchable';
import { E2E_MESSAGE_TYPE } from '../../lib/encryption/constants';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';
import { BUTTON_HIT_SLOP } from './utils';
import MessageContext from './Context';
import styles from './styles';
import { useTheme } from '../../theme';

const Encrypted = React.memo(({ type }: { type: string }) => {
	const { theme } = useTheme();
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

export default Encrypted;
