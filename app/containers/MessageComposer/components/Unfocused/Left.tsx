import React from 'react';
import { View } from 'react-native';

import { useMessageComposerState } from '../../context';
import { ActionsButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';

export const Left = () => {
	console.count('[MessageComposer] Left');
	const { focused, showEmojiKeyboard, showEmojiSearchbar } = useMessageComposerState();
	if (focused || showEmojiKeyboard || showEmojiSearchbar) {
		return null;
	}
	return (
		<View style={{ height: MIN_HEIGHT, paddingRight: 12, justifyContent: 'center' }}>
			<ActionsButton />
		</View>
	);
};
