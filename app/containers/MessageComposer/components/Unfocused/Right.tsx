import React, { useContext } from 'react';
import { View } from 'react-native';

import { MessageComposerContext } from '../../context';
import { MicOrSendButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';
import { CancelEdit } from '../CancelEdit';

export const Right = () => {
	const { focused, showEmojiKeyboard, showEmojiSearchbar } = useContext(MessageComposerContext);
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
