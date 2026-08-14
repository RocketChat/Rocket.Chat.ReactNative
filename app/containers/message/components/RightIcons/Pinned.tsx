import { type ReactElement } from 'react';

import { CustomIcon } from '../../../CustomIcon';
import styles from '../../styles';
import { useMessageField, useMessageText } from '../../stores/MessageStore';

const Pinned = (): ReactElement | null => {
	const pinned = useMessageField(item => item.pinned);
	const { messageText } = useMessageText();

	if (pinned) return <CustomIcon testID={`${messageText}-pinned`} name='pin' size={16} style={styles.rightIcons} />;
	return null;
};

export default Pinned;
