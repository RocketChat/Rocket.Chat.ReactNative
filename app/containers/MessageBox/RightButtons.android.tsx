import React from 'react';
import { View } from 'react-native';

import { ActionsButton, SendButton } from './buttons';
import styles from './styles';

interface IMessageBoxRightButtons {
	showSend: boolean;
	submit(): void;
	showMessageBoxActions(): void;
	isActionsEnabled: boolean;
}

const RightButtons = React.memo(({ showSend, submit, showMessageBoxActions, isActionsEnabled }: IMessageBoxRightButtons) => {
	if (showSend) {
		return <SendButton onPress={submit} />;
	}
	if (isActionsEnabled) {
		return <ActionsButton onPress={showMessageBoxActions} />;
	}
	return <View style={styles.buttonsWhitespace} />;
});

export default RightButtons;
