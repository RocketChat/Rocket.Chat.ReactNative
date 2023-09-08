import React from 'react';
import { View } from 'react-native';

import { useFocused, useShowEmojiKeyboard, useShowEmojiSearchbar } from '../../context';
import { ActionsButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';

export const Left = () => {
	console.count('[MessageComposer] Left');
	const focused = useFocused();
	const showEmojiKeyboard = useShowEmojiKeyboard();
	const showEmojiSearchbar = useShowEmojiSearchbar();
	if (focused || showEmojiKeyboard || showEmojiSearchbar) {
		return null;
	}
	return (
		<View style={{ height: MIN_HEIGHT, paddingRight: 12, justifyContent: 'center' }}>
			<ActionsButton />
		</View>
	);
};
