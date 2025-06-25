import React from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useTheme } from '../../../../theme';

const ReadReceipt = React.memo(({ isReadReceiptEnabled, unread }: { isReadReceiptEnabled?: boolean; unread?: boolean }) => {
	const { colors } = useTheme();
	const isUnread = unread || unread === null;
	const iconName = isUnread ? 'check-single' : 'check-double';
	const iconColor = isUnread ? colors.fontAnnotation : colors.fontInfo;
	const marginTop = -5;

	if (isReadReceiptEnabled) {
		return (
			<CustomIcon
				name={iconName}
				color={iconColor}
				size={25}
				style={{ ...styles.rightIcons, marginTop }}
				testID={isUnread ? 'read-receipt-unread' : 'read-receipt-read'}
			/>
		);
	}
	return null;
});
ReadReceipt.displayName = 'MessageReadReceipt';

export default ReadReceipt;
