import React from 'react';
import PropTypes from 'prop-types';

import { COLOR_PRIMARY } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';

const ReadReceipt = React.memo(({ isReadReceiptEnabled, unread }) => {
	if (isReadReceiptEnabled && !unread && unread !== null) {
		return <CustomIcon name='check' color={COLOR_PRIMARY} size={15} style={styles.readReceipt} />;
	}
	return null;
});
ReadReceipt.displayName = 'MessageReadReceipt';

ReadReceipt.propTypes = {
	isReadReceiptEnabled: PropTypes.bool,
	unread: PropTypes.bool
};

export default ReadReceipt;
