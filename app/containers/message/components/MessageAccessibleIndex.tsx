import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { A11y } from 'react-native-a11y-order';

import { useMessageText } from '../stores/MessageStore';
import { useAutoTranslate } from '../stores/MessageRoomStore';

const MessageAccessibleIndex = ({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) => {
	'use memo';

	const { messageText, isTranslated } = useMessageText();
	const { autoTranslateLanguage } = useAutoTranslate();

	return (
		<A11y.Index
			accessible={isTranslated}
			accessibilityLabel={messageText || ''}
			accessibilityLanguage={autoTranslateLanguage}
			index={2}
			style={style}>
			{children}
		</A11y.Index>
	);
};

export default MessageAccessibleIndex;
