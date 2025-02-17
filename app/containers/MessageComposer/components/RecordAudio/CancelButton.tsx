import React, { ReactElement } from 'react';

import { BaseButton, IBaseButton } from '../Buttons';

export const CancelButton = ({ onPress }: { onPress: IBaseButton['onPress'] }): ReactElement => (
	<BaseButton onPress={onPress} testID='message-composer-delete-audio' accessibilityLabel='Cancel' icon='delete' />
);
