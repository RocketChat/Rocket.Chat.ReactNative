import { type ReactElement } from 'react';

import * as HeaderButton from '~/containers/Header/components/HeaderButton';
import i18n from '~/i18n';

interface IThreadRightButtonsLegacyProps {
	isFollowingThread: boolean;
	onToggleFollowThread: () => void;
}

export const ThreadRightButtonsLegacy = ({
	isFollowingThread,
	onToggleFollowThread
}: IThreadRightButtonsLegacyProps): ReactElement => (
	<HeaderButton.Container>
		<HeaderButton.Item
			accessibilityLabel={i18n.t(isFollowingThread ? 'Unfollow_thread' : 'Follow_thread')}
			iconName={isFollowingThread ? 'notification' : 'notification-disabled'}
			onPress={onToggleFollowThread}
			testID={isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'}
		/>
	</HeaderButton.Container>
);
