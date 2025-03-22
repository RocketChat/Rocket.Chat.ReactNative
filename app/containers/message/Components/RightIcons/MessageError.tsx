import React, { useContext } from 'react';

import Touchable from '../../Touchable';
import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { BUTTON_HIT_SLOP } from '../../utils';
import { themes } from '../../../../lib/constants';
import MessageContext from '../../Context';
import { useTheme } from '../../../../theme';

const MessageError = React.memo(
	({ hasError }: { hasError: boolean }) => {
		const { theme } = useTheme();
		const { onErrorPress } = useContext(MessageContext);

		if (!hasError) {
			return null;
		}

		return (
			<Touchable onPress={onErrorPress} style={styles.rightIcons} hitSlop={BUTTON_HIT_SLOP}>
				<CustomIcon name='warning' color={themes[theme].buttonBackgroundDangerDefault} size={16} />
			</Touchable>
		);
	},
	(prevProps, nextProps) => prevProps.hasError === nextProps.hasError
);

MessageError.displayName = 'MessageError';

export default MessageError;
