import React, { ReactElement } from 'react';

import { BaseButton, IBaseButton } from '../Buttons';

export const CancelButton = ({
	onPress,
	accessibilityLabel
}: {
	onPress: IBaseButton['onPress'];
	accessibilityLabel?: string;
}): ReactElement => (
	<BaseButton
		onPress={onPress}
		testID='message-composer-delete-audio'
		accessibilityLabel={accessibilityLabel ?? 'Cancel_and_delete_recording'}
		icon='delete'
	/>
);
