import { type ReactElement } from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useMessageField } from '../../MessageStore';

const Pinned = ({ testID }: { testID?: string }): ReactElement | null => {
	'use memo';

	const pinned = useMessageField(item => item.pinned);

	if (pinned) return <CustomIcon testID={testID} name='pin' size={16} style={styles.rightIcons} />;
	return null;
};

export default Pinned;
