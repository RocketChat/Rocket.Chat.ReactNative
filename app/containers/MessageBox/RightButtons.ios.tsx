import React from 'react';

import { SendButton } from './buttons';

interface IMessageBoxRightButtons {
	theme: string;
	showSend: boolean;
	submit(): void;
}

const RightButtons = React.memo(({ theme, showSend, submit }: IMessageBoxRightButtons) => {
	if (showSend) {
		return <SendButton theme={theme} onPress={submit} />;
	}
	return null;
});

export default RightButtons;
