import React, { useContext } from 'react';

import { CustomIcon } from '../../../CustomIcon';
import { BUTTON_HIT_SLOP } from '../../utils';
import MessageContext from '../../Context';
import styles from '../../styles';
import { E2E_MESSAGE_TYPE } from '../../../../lib/constants/keys';
import PressableOpacity from '../../../PressableOpacity';
import { useTheme } from '../../../../theme';

const Encrypted = React.memo(({ type }: { type: string }) => {
	'use memo';

	const { onEncryptedPress } = useContext(MessageContext);
	const { colors } = useTheme();

	if (type !== E2E_MESSAGE_TYPE) {
		return null;
	}

	return (
		<PressableOpacity
			onPress={onEncryptedPress}
			style={styles.rightIcons}
			hitSlop={BUTTON_HIT_SLOP}
			android_ripple={{ color: colors.surfaceNeutralPress }}
			disableOpacityOnAndroid>
			<CustomIcon name='encrypted' size={16} />
		</PressableOpacity>
	);
});

export default Encrypted;
