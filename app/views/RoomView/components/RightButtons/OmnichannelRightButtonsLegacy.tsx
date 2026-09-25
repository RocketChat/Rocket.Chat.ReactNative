import { type ReactElement } from 'react';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';

interface IOmnichannelRightButtonsLegacyProps {
	onShowMoreActions: () => void;
}

export const OmnichannelRightButtonsLegacy = ({ onShowMoreActions }: IOmnichannelRightButtonsLegacyProps): ReactElement => (
	<HeaderButton.Container>
		<HeaderButton.Item iconName='kebab' onPress={onShowMoreActions} testID='room-view-header-omnichannel-kebab' />
	</HeaderButton.Container>
);
