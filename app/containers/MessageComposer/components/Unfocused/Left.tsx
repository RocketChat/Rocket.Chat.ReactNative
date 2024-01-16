import React from 'react';
import { View } from 'react-native';

import { useFocused, useShowEmojiKeyboard, useShowEmojiSearchbar } from '../../context';
import { ActionsButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';
import { useRoomContext } from '../../../../views/RoomView/context';

export const Left = () => {
	const { sharing } = useRoomContext();
	const focused = useFocused();
	const showEmojiKeyboard = useShowEmojiKeyboard();
	const showEmojiSearchbar = useShowEmojiSearchbar();
	if (focused || showEmojiKeyboard || showEmojiSearchbar || sharing) {
		return null;
	}
	return (
		<View style={{ height: MIN_HEIGHT, paddingRight: 12, justifyContent: 'center' }}>
			<ActionsButton />
		</View>
	);
};
