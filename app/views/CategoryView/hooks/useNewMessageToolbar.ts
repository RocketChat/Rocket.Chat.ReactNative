import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';

import i18n from '~/i18n';
import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { headerRightActions } from '~/lib/methods/helpers/navigation/headerActions';
import { useTheme } from '~/theme';
import { useNewMessage } from '~/views/RoomsListView/hooks/useNewMessage';

export const useNewMessageToolbar = () => {
	const navigation = useNavigation();
	const { colors } = useTheme();
	const { canCreateRoom, goToNewMessage } = useNewMessage();

	useLayoutEffect(() => {
		if (!hasNativeHeaderBar || !canCreateRoom) {
			return;
		}
		navigation.setOptions(
			headerRightActions([
				{
					label: i18n.t('Create_new_channel_team_dm_discussion'),
					icon: 'add',
					tintColor: colors.buttonBackgroundPrimaryDefault,
					variant: 'prominent',
					placement: 'toolbar',
					onPress: goToNewMessage
				}
			])
		);
	}, [navigation, colors, canCreateRoom, goToNewMessage]);

	return { showNewMessageButton: !hasNativeHeaderBar && canCreateRoom, goToNewMessage };
};
