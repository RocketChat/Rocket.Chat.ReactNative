import { type ReactElement } from 'react';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import { useHeaderCallPress } from './useHeaderCallPress';

export const HeaderCallButton = ({
	rid,
	disabled,
	accessibilityLabel
}: {
	rid: string;
	disabled: boolean;
	accessibilityLabel: string;
}): ReactElement | null => {
	const { callPresent, isCallDisabled, onPressCall } = useHeaderCallPress(rid);

	if (!callPresent) {
		return null;
	}

	return (
		<HeaderButton.Item
			accessibilityLabel={accessibilityLabel}
			disabled={disabled || isCallDisabled}
			iconName='phone'
			onPress={onPressCall}
			testID='room-view-header-call'
		/>
	);
};
