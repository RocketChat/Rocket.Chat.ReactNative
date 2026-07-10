import { type ReactElement } from 'react';
import { View } from 'react-native';

import { useFocused } from '../../context';
import { useEmojiKeyboard } from '../../hooks/useEmojiKeyboard';
import { ActionsButton } from '../Buttons';
import { MIN_HEIGHT } from '../../constants';
import { useComposerSharing } from '../../../../views/RoomView/stores/ComposerStore';

export const Left = (): ReactElement | null => {
	'use memo';

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
