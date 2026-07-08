import { View } from 'react-native';
import { A11y } from 'react-native-a11y-order';

import styles from '../../styles';
import MessageAvatar from '../MessageAvatar';
import RightIcons from '../RightIcons';
import { Layout } from '../Layout';
import { useMessageField, useMessageGrouping, useMessageText } from '../../stores/MessageStore';
import { useAutoTranslate } from '../../stores/MessageRoomStore';

const FullMessage = ({ isPreview }: { isPreview?: boolean }) => {
	'use memo';

	const isHeader = useMessageGrouping();
	const { messageText, isTranslated } = useMessageText();
	const { autoTranslateLanguage } = useAutoTranslate();
	const id = useMessageField(item => item.id);

	return (
		<View testID={`message-${id}`} style={styles.container}>
			<A11y.Index
				accessible={isTranslated}
				accessibilityLabel={messageText || ''}
				accessibilityLanguage={autoTranslateLanguage}
				index={2}>
				<View style={styles.flex}>
					<MessageAvatar />
					<View style={styles.messageContent}>
						<Layout isPreview={isPreview} isHeader={isHeader} />
					</View>
					{!isHeader ? <RightIcons /> : null}
				</View>
			</A11y.Index>
		</View>
	);
};

export default FullMessage;
