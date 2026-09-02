import { type ReactElement } from 'react';
import { View } from 'react-native';

import { useComposerSharing, useFocused } from '../../store';
import { useEmojiKeyboard } from '../../hooks/useEmojiKeyboard';
import { ActionsButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';

export const Left = (): ReactElement | null => {
	const sharing = useComposerSharing();
	const focused = useFocused();
	const { showEmojiKeyboard, showEmojiSearchbar } = useEmojiKeyboard();
	if (focused || showEmojiKeyboard || showEmojiSearchbar || sharing) {
		return null;
	}

	return (
		<View style={{ height: MIN_HEIGHT, paddingRight: 12, justifyContent: 'center' }}>
			<ActionsButton />
		</View>
	);
};
