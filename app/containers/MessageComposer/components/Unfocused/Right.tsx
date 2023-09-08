import React from 'react';
import { View } from 'react-native';

import { useFocused, useShowEmojiKeyboard, useShowEmojiSearchbar } from '../../context';
import { MicOrSendButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';
import { CancelEdit } from '../CancelEdit';

export const Right = () => {
	const focused = useFocused();
	const showEmojiKeyboard = useShowEmojiKeyboard();
	const showEmojiSearchbar = useShowEmojiSearchbar();
	if (focused || showEmojiKeyboard || showEmojiSearchbar) {
		return null;
	}
	return (
		<View style={{ height: MIN_HEIGHT, paddingLeft: 12, alignItems: 'center', flexDirection: 'row' }}>
			<CancelEdit />
			<MicOrSendButton />
		</View>
	);
};
