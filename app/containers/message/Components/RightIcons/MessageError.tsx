import React, { useContext } from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { BUTTON_HIT_SLOP } from '../../utils';
import { themes } from '../../../../lib/constants/colors';
import MessageContext from '../../Context';
import { useTheme } from '../../../../theme';
import PressableOpacity from '../../../PressableOpacity';

const MessageError = React.memo(
	({ hasError }: { hasError: boolean }) => {
		'use memo';

		const { theme } = useTheme();
		const { onErrorPress } = useContext(MessageContext);

		if (!hasError) {
			return null;
		}

		return (
			<PressableOpacity
				onPress={onErrorPress}
				style={styles.rightIcons}
				hitSlop={BUTTON_HIT_SLOP}
				android_ripple={{ color: themes[theme].surfaceNeutralPress }}
				disableOpacityOnAndroid>
				<CustomIcon name='warning' color={themes[theme].buttonBackgroundDangerDefault} size={16} />
			</PressableOpacity>
		);
	},
	(prevProps, nextProps) => prevProps.hasError === nextProps.hasError
);

MessageError.displayName = 'MessageError';

export default MessageError;
