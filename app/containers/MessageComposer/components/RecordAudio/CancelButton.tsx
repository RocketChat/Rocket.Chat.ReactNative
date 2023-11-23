import React, { ReactElement } from 'react';

import { BaseButton } from '../Buttons';

export const CancelButton = ({ onPress }: { onPress: Function }): ReactElement => (
	<BaseButton onPress={() => onPress()} testID='message-composer-delete-audio' accessibilityLabel='tbd' icon='delete' />
);
