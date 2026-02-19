import { View } from 'react-native';
import { type ReactElement } from 'react';

import { useFocused } from '../../context';
import { useEmojiKeyboard } from '../../hooks/useEmojiKeyboard';
import { MicOrSendButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';
import { CancelEdit } from '../CancelEdit';

export const Right = (): ReactElement | null => {
	'use memo';

	const focused = useFocused();
	const { showEmojiKeyboard, showEmojiSearchbar } = useEmojiKeyboard();

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
