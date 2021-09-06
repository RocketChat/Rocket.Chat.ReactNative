import React from 'react';

import BaseButton from './BaseButton';

interface ICancelEditingButton {
	theme: string;
	onPress(): void;
}

const CancelEditingButton = React.memo(({ theme, onPress }: ICancelEditingButton) => (
	<BaseButton
		onPress={onPress}
		testID='messagebox-cancel-editing'
		accessibilityLabel='Cancel_editing'
		icon='close'
		theme={theme}
	/>
));

export default CancelEditingButton;
