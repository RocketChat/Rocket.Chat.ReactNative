import { type ReactElement } from 'react';

import { CustomIcon } from '~/containers/CustomIcon';
import styles from '~/containers/message/styles';
import { useMessageField, useMessageText } from '~/containers/message/stores/MessageStore';

const Pinned = (): ReactElement | null => {
	const pinned = useMessageField(item => item.pinned);
	const { messageText } = useMessageText();

	if (pinned) return <CustomIcon testID={`${messageText}-pinned`} name='pin' size={16} style={styles.rightIcons} />;
	return null;
};

export default Pinned;
