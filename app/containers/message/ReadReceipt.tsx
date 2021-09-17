import React from 'react';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';

interface IMessageReadReceipt {
	isReadReceiptEnabled: boolean;
	unread: boolean;
	theme: string;
}

const ReadReceipt = React.memo(({ isReadReceiptEnabled, unread, theme }: IMessageReadReceipt) => {
	if (isReadReceiptEnabled && !unread && unread !== null) {
		return <CustomIcon name='check' color={themes[theme].tintColor} size={15} style={styles.readReceipt} />;
	}
	return null;
});
ReadReceipt.displayName = 'MessageReadReceipt';

export default ReadReceipt;
