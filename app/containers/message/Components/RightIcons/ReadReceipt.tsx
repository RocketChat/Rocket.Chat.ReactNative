import React from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useTheme } from '../../../../theme';

const ReadReceipt = React.memo(({ isReadReceiptEnabled, unread }: { isReadReceiptEnabled?: boolean; unread?: boolean }) => {
	const { colors } = useTheme();
	const iconName = unread ? 'check' : 'check-double';
	const iconColor = unread ? colors.fontAnnotation : colors.fontInfo;

	if (isReadReceiptEnabled) {
		return <CustomIcon name={iconName} color={iconColor} size={16} style={styles.rightIcons} />;
	}
	return null;
});
ReadReceipt.displayName = 'MessageReadReceipt';

export default ReadReceipt;
