import React from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';

const Pinned = ({ pinned, testID }: { pinned?: boolean; testID?: string }): React.ReactElement | null => {
	if (pinned) return <CustomIcon testID={testID} name='pin' size={16} style={styles.rightIcons} />;
	return null;
};

export default Pinned;
