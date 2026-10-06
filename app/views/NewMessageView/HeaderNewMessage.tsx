import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type ReactElement, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { createChannelRequest } from '~/actions/createChannel';
import SearchBox from '~/containers/SearchBox';
import { CustomIcon, type TIconsName } from '~/containers/CustomIcon';
import I18n from '~/i18n';
import Navigation from '~/lib/navigation/appNavigation';
import { useTheme } from '~/theme';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { type NewMessageStackParamList } from '~/stacks/types';
import { compareServerVersion } from '~/lib/methods/helpers';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { useListBackgroundColor } from '~/containers/NativeListRow/hooks/useListBackgroundColor';
import { useHasCustomCategoriesLicense } from '~/views/RoomsListView/hooks/useSidebarCategories';
import ButtonCreate from './ButtonCreate';
import FolderPlusIcon from './FolderPlusIcon';

const styles = StyleSheet.create({
	container: {
		paddingTop: 16
	}
});

interface IButtonConfig {
	visible: boolean;
	onPress: () => void;
	title: string;
	icon: ReactElement;
	testID: string;
}

const HeaderNewMessage = ({ maxUsers, onChangeText }: { maxUsers: number; onChangeText: (text: string) => void }) => {
	const navigation = useNavigation<NativeStackNavigationProp<NewMessageStackParamList, 'NewMessageView'>>();
	const dispatch = useDispatch();
	const { colors } = useTheme();
	const listBackgroundColor = useListBackgroundColor(colors.surfaceTint);
	const hasCustomCategoriesLicense = useHasCustomCategoriesLicense();

	const serverVersion = useAppSelector(state => state.server.version as string);

	const [
		createPublicChannelPermission,
		createPrivateChannelPermission,
		createTeamPermission,
		createDirectMessagePermission,
		createDiscussionPermission
	] = usePermissions(['create-c', 'create-p', 'create-team', 'create-d', 'start-discussion']);

	const createChannel = useCallback(() => {
		logEvent(events.NEW_MSG_CREATE_CHANNEL);
		navigation.navigate('SelectedUsersView', { nextAction: () => navigation.navigate('CreateChannelView') });
	}, [navigation]);

	const createTeam = useCallback(() => {
		logEvent(events.NEW_MSG_CREATE_TEAM);
		navigation.navigate('SelectedUsersView', {
			nextAction: () => navigation.navigate('CreateChannelView', { isTeam: true })
		});
	}, [navigation]);

	const createGroupChat = useCallback(() => {
		logEvent(events.NEW_MSG_CREATE_GROUP_CHAT);
		navigation.navigate('SelectedUsersView', {
			nextAction: () => dispatch(createChannelRequest({ group: true })),
			buttonText: I18n.t('Create'),
			maxUsers
		});
	}, [dispatch, maxUsers, navigation]);

	const createDiscussion = useCallback(() => {
		logEvent(events.NEW_MSG_CREATE_DISCUSSION);
		navigation.navigate('SelectedUsersView', {
			nextAction: () => Navigation.navigate('CreateDiscussionView'),
			title: I18n.t('Create_Discussion'),
			buttonText: I18n.t('Next')
		});
	}, [navigation]);

	const createCategory = useCallback(() => {
		navigation.navigate('CreateCategoryView');
	}, [navigation]);

	const renderIcon = (name: TIconsName) => <CustomIcon name={name} size={24} color={colors.fontDefault} />;

	const buttons = [
		{
			visible: createPublicChannelPermission || createPrivateChannelPermission,
			onPress: createChannel,
			title: 'Channel',
			icon: renderIcon('channel-public'),
			testID: 'new-message-view-create-channel'
		},
		{
			visible: compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.13.0') && createTeamPermission,
			onPress: createTeam,
			title: 'Team',
			icon: renderIcon('teams'),
			testID: 'new-message-view-create-team'
		},
		{
			visible: maxUsers > 2 && createDirectMessagePermission,
			onPress: createGroupChat,
			title: 'Direct_message',
			icon: renderIcon('message'),
			testID: 'new-message-view-create-direct-message'
		},
		{
			visible: createDiscussionPermission,
			onPress: createDiscussion,
			title: 'Discussion',
			icon: renderIcon('discussions'),
			testID: 'new-message-view-create-discussion'
		},
		{
			visible: hasCustomCategoriesLicense,
			onPress: createCategory,
			title: 'Category',
			icon: <FolderPlusIcon color={colors.fontDefault} />,
			testID: 'new-message-view-create-category'
		}
	].filter((button): button is IButtonConfig => Boolean(button.visible));

	return (
		<View style={[styles.container, { backgroundColor: listBackgroundColor }]}>
			{buttons.map((button, index) => (
				<ButtonCreate
					key={button.testID}
					onPress={button.onPress}
					title={button.title}
					icon={button.icon}
					testID={button.testID}
					isFirst={index === 0}
					isLast={index === buttons.length - 1}
				/>
			))}
			<SearchBox onChangeText={(text: string) => onChangeText(text)} testID='new-message-view-search' />
		</View>
	);
};

export default HeaderNewMessage;
