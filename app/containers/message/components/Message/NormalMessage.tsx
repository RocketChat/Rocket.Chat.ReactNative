import { View } from 'react-native';
import { A11y } from 'react-native-a11y-order';

import styles from '../../styles';
import MessageAvatar from '../MessageAvatar';
import RightIcons from '../RightIcons';
import { MessageInner } from './MessageInner';
import { useMessageField, useMessageGrouping, useMessageText } from '../../stores/MessageStore';
import { useAutoTranslate } from '../../stores/MessageRoomStore';

const NormalMessage = ({ isPreview }: { isPreview?: boolean }) => {
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
						<MessageInner isPreview={isPreview} />
					</View>
					{!isHeader ? <RightIcons /> : null}
				</View>
			</A11y.Index>
		</View>
	);
};

NormalMessage.displayName = 'MessageNormal';

export default NormalMessage;
