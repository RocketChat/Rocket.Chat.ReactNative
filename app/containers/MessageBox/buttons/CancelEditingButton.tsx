import React from 'react';

import BaseButton from './BaseButton';

interface ICancelEditingButton {
	onPress(): void;
}

const CancelEditingButton = ({ onPress }: ICancelEditingButton) => (
	<BaseButton onPress={onPress} testID='messagebox-cancel-editing' accessibilityLabel='Cancel_editing' icon='close' />
);

export default CancelEditingButton;
