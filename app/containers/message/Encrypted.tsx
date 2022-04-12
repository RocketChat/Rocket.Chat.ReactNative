import React, { useContext } from 'react';

import Touchable from './Touchable';
import { CustomIcon } from '../CustomIcon';
import { BUTTON_HIT_SLOP } from './utils';
import MessageContext from './Context';
import styles from './styles';
import { useTheme } from '../../theme';
import { E2E_MESSAGE_TYPE, themes } from '../../lib/constants';

const Encrypted = React.memo(({ type }: { type: string }) => {
	const { theme } = useTheme();
	const { onEncryptedPress } = useContext(MessageContext);

	if (type !== E2E_MESSAGE_TYPE) {
		return null;
	}

	return (
		<Touchable onPress={onEncryptedPress} style={styles.encrypted} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='encrypted' size={16} color={themes[theme].auxiliaryText} />
		</Touchable>
	);
});

export default Encrypted;
