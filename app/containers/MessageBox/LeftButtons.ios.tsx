import React from 'react';
import { View } from 'react-native';

import { ActionsButton, CancelEditingButton } from './buttons';
import styles from './styles';

interface IMessageBoxLeftButtons {
	theme: string;
	showMessageBoxActions(): void;
	editing: boolean;
	editCancel(): void;
	isActionsEnabled: boolean;
}

const LeftButtons = React.memo(
	({ theme, showMessageBoxActions, editing, editCancel, isActionsEnabled }: IMessageBoxLeftButtons) => {
		if (editing) {
			return <CancelEditingButton onPress={editCancel} theme={theme} />;
		}
		if (isActionsEnabled) {
			return <ActionsButton onPress={showMessageBoxActions} theme={theme} />;
		}
		return <View style={styles.buttonsWhitespace} />;
	}
);

export default LeftButtons;
