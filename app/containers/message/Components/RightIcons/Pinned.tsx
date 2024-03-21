import React from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useTheme } from '../../../../theme';

const Pinned = React.memo(({ pinned, testID }: { pinned?: boolean; testID?: string }) => {
	const { colors } = useTheme();
	if (pinned) {
		return <CustomIcon testID={testID} name='pin' color={colors.auxiliaryTintColor} size={16} style={styles.rightIcons} />;
	}
	return null;
});

export default Pinned;
