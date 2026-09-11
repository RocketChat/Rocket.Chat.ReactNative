import { type ReactNode } from 'react';
import { View } from 'react-native';

import styles from '~/containers/message/styles';
import { useMessageStatus, useMessageText } from '~/containers/message/stores/MessageStore';

const ContentWrapper = ({ children }: { children: ReactNode }) => {
	const { isTemp } = useMessageStatus();
	const { messageText } = useMessageText();

	return (
		<View style={isTemp && styles.temp} testID={`message-content-${messageText || ''}`}>
			{children}
		</View>
	);
};

export default ContentWrapper;
