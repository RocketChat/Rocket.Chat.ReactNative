import React, { useContext } from 'react';
import { View } from 'react-native';

import { MessageComposerContext } from '../../context';
import { ActionsButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';

export const Left = () => {
	const { focused, showEmojiKeyboard, showEmojiSearchbar } = useContext(MessageComposerContext);
	if (focused || showEmojiKeyboard || showEmojiSearchbar) {
		return null;
	}
	return (
		<View style={{ height: MIN_HEIGHT, paddingRight: 12, justifyContent: 'center' }}>
			<ActionsButton />
		</View>
	);
};
