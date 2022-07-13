import React from 'react';

import { ActionsButton, SendButton } from './buttons';

interface IMessageBoxRightButtons {
	showSend: boolean;
	submit(): void;
	showMessageBoxActions(): void;
	isActionsEnabled: boolean;
}

const RightButtons = ({ showSend, submit, showMessageBoxActions, isActionsEnabled }: IMessageBoxRightButtons) => {
	if (showSend) {
		return <SendButton onPress={submit} />;
	}
	if (isActionsEnabled) {
		return <ActionsButton onPress={showMessageBoxActions} />;
	}
	return null;
};

export default RightButtons;
