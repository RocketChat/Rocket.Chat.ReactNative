import { type ReactElement } from 'react';
import { View } from 'react-native';

import { useFocused } from '~/containers/MessageComposer/context';
import { useEmojiKeyboard } from '~/containers/MessageComposer/hooks/useEmojiKeyboard';
import { ActionsButton } from '../Buttons';
import { MIN_HEIGHT } from '~/containers/MessageComposer/constants';
import { useRoomContext } from '~/views/RoomView/context';

export const Left = (): ReactElement | null => {
	const { sharing } = useRoomContext();
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
