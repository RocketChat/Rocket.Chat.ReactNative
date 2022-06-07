import React from 'react';
import { View } from 'react-native';

import { ActionsButton, CancelEditingButton } from './buttons';
import styles from './styles';

interface IMessageBoxLeftButtons {
	showMessageBoxActions(): void;
	editing: boolean;
	editCancel(): void;
	isActionsEnabled: boolean;
}

const LeftButtons = React.memo(({ showMessageBoxActions, editing, editCancel, isActionsEnabled }: IMessageBoxLeftButtons) => {
	if (editing) {
		return <CancelEditingButton onPress={editCancel} />;
	}
	if (isActionsEnabled) {
		return <ActionsButton onPress={showMessageBoxActions} />;
	}
	return <View style={styles.buttonsWhitespace} />;
});

export default LeftButtons;
