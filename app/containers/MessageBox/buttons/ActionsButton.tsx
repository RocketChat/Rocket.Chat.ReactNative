import React from 'react';

import BaseButton from './BaseButton';

interface IActionsButton {
	theme: string;
	onPress(): void;
}

const ActionsButton = React.memo(({ theme, onPress }: IActionsButton) => (
	<BaseButton onPress={onPress} testID='messagebox-actions' accessibilityLabel='Message_actions' icon='add' theme={theme} />
));

export default ActionsButton;
