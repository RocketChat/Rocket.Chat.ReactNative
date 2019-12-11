import React from 'react';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';

const ReadReceipt = React.memo(({ isReadReceiptEnabled, unread, theme }) => {
	if (isReadReceiptEnabled && !unread && unread !== null) {
		return <CustomIcon name='check' color={themes[theme].tintColor} size={15} style={styles.readReceipt} />;
	}
	return null;
});
ReadReceipt.displayName = 'MessageReadReceipt';

ReadReceipt.propTypes = {
	isReadReceiptEnabled: PropTypes.bool,
	unread: PropTypes.bool,
	theme: PropTypes.bool
};

export default ReadReceipt;
