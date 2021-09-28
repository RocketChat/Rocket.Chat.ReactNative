import React from 'react';

import { CancelEditingButton, ToggleEmojiButton } from './buttons';

interface IMessageBoxLeftButtons {
	theme: string;
	showEmojiKeyboard: boolean;
	openEmoji(): void;
	closeEmoji(): void;
	editing: boolean;
	editCancel(): void;
}

const LeftButtons = React.memo(
	({ theme, showEmojiKeyboard, editing, editCancel, openEmoji, closeEmoji }: IMessageBoxLeftButtons) => {
		if (editing) {
			return <CancelEditingButton onPress={editCancel} theme={theme} />;
		}
		return <ToggleEmojiButton show={showEmojiKeyboard} open={openEmoji} close={closeEmoji} theme={theme} />;
	}
);

export default LeftButtons;
