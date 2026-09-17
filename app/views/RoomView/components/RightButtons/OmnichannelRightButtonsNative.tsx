import { type ReactElement } from 'react';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';

interface IOmnichannelRightButtonsNativeProps {
	onShowMoreActions: () => void;
}

export const OmnichannelRightButtonsNative = ({ onShowMoreActions }: IOmnichannelRightButtonsNativeProps): ReactElement => (
	<HeaderButton.Container>
		<HeaderButton.Item iconName='kebab' onPress={onShowMoreActions} testID='room-view-header-omnichannel-kebab' />
	</HeaderButton.Container>
);
