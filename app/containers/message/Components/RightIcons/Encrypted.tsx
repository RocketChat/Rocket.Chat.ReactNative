import { memo, useContext } from 'react';

import Touchable from '../../Touchable';
import { CustomIcon } from '../../../CustomIcon';
import { BUTTON_HIT_SLOP } from '../../utils';
import MessageContext from '../../Context';
import styles from '../../styles';
import { E2E_MESSAGE_TYPE } from '../../../../lib/constants/keys';

const Encrypted = memo(({ type }: { type: string }) => {
	'use memo';

	const { onEncryptedPress } = useContext(MessageContext);

	if (type !== E2E_MESSAGE_TYPE) {
		return null;
	}

	return (
		<Touchable onPress={onEncryptedPress} style={styles.rightIcons} hitSlop={BUTTON_HIT_SLOP}>
			<CustomIcon name='encrypted' size={16} />
		</Touchable>
	);
});

export default Encrypted;
