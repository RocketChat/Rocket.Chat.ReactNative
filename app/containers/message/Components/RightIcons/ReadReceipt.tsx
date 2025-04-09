import React from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useTheme } from '../../../../theme';

const ReadReceipt = React.memo(({ isReadReceiptEnabled, unread }: { isReadReceiptEnabled?: boolean; unread?: boolean }) => {
	const { colors } = useTheme();
	const iconName = unread ? 'check' : 'check-double';
	const iconColor = unread ? colors.fontAnnotation : colors.fontInfo;
	const size = unread ? 20 : 25;
	const marginTop = unread ? { marginTop: -3 } : { marginTop: -5 };

	if (isReadReceiptEnabled) {
		return <CustomIcon name={iconName} color={iconColor} size={size} style={[styles.rightIcons, marginTop]} />;
	}
	return null;
});
ReadReceipt.displayName = 'MessageReadReceipt';

export default ReadReceipt;
