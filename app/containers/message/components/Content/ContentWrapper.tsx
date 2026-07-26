import { type ReactNode } from 'react';
import { View } from 'react-native';

import styles from '../../styles';
import { useMessageStatus, useMessageText } from '../../stores/MessageStore';

const ContentWrapper = ({ children }: { children: ReactNode }) => {
	'use memo';

	const { isTemp } = useMessageStatus();
	const { messageText } = useMessageText();

	return (
		<View style={isTemp && styles.temp} testID={`message-content-${messageText || ''}`}>
			{children}
		</View>
	);
};

export default ContentWrapper;
