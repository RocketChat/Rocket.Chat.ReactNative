import React from 'react';

import { SendButton } from './buttons';

interface IMessageBoxRightButtons {
	showSend: boolean;
	submit(): void;
}

const RightButtons = ({ showSend, submit }: IMessageBoxRightButtons) => {
	if (showSend) {
		return <SendButton onPress={submit} />;
	}
	return null;
};

export default RightButtons;
