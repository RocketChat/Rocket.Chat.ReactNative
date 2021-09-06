import React from 'react';
import { View } from 'react-native';

import { ActionsButton, SendButton } from './buttons';
import styles from './styles';

interface IMessageBoxRightButtons {
	theme: string;
	showSend: boolean;
	submit(): void;
	showMessageBoxActions(): void;
	isActionsEnabled: boolean;
}

const RightButtons = React.memo(
	({ theme, showSend, submit, showMessageBoxActions, isActionsEnabled }: IMessageBoxRightButtons) => {
		if (showSend) {
			return <SendButton onPress={submit} theme={theme} />;
		}
		if (isActionsEnabled) {
			return <ActionsButton onPress={showMessageBoxActions} theme={theme} />;
		}

		return <View style={styles.buttonsWhitespace} />;
	}
);

export default RightButtons;
