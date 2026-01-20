import React from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';

const Starred = ({ starred, testID }: { starred?: boolean; testID?: string }): React.ReactElement | null => {
	'use memo';

	if (starred === true) return <CustomIcon testID={testID} name='star-filled' size={16} style={styles.rightIcons} />;
	return null;
};

export default Starred;
