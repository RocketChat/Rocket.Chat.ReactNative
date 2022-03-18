import React from 'react';

import BaseButton from './BaseButton';

interface IActionsButton {
	onPress(): void;
}

const ActionsButton = ({ onPress }: IActionsButton) => (
	<BaseButton onPress={onPress} testID='messagebox-actions' accessibilityLabel='Message_actions' icon='add' />
);

export default ActionsButton;
