import React from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useTheme } from '../../../../theme';

const ReadReceipt = React.memo(({ isReadReceiptEnabled, unread }: { isReadReceiptEnabled?: boolean; unread?: boolean }) => {
	const { colors } = useTheme();
	if (isReadReceiptEnabled) {
		return (
			<CustomIcon
				name='check'
				color={!unread && unread !== null ? colors.badgeBackgroundLevel2 : colors.fontHint}
				size={16}
				style={styles.rightIcons}
			/>
		);
	}
	return null;
});
ReadReceipt.displayName = 'MessageReadReceipt';

export default ReadReceipt;
