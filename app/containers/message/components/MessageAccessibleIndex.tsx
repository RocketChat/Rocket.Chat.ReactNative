import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { useMessageText } from '../stores/MessageStore';
import { useAutoTranslate } from '../stores/MessageRoomStore';
import MessageA11yIndex from './MessageA11yIndex';

const MessageAccessibleIndex = ({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) => {
	const { messageText, isTranslated } = useMessageText();
	const { autoTranslateLanguage } = useAutoTranslate();

	return (
		<MessageA11yIndex
			accessible={isTranslated}
			accessibilityLabel={messageText || ''}
			accessibilityLanguage={autoTranslateLanguage}
			index={2}
			style={style}>
			{children}
		</MessageA11yIndex>
	);
};

export default MessageAccessibleIndex;
