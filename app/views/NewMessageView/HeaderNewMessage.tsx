import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { createChannelRequest } from '../../actions/createChannel';
import { themes } from '../../lib/constants';
import SearchBox from '../../containers/SearchBox';
import I18n from '../../i18n';
import Navigation from '../../lib/navigation/appNavigation';
import { useTheme } from '../../theme';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { NewMessageStackParamList } from '../../stacks/types';
import { compareServerVersion } from '../../lib/methods/helpers';
import { useAppSelector, usePermissions } from '../../lib/hooks';
import ButtonCreate from './ButtonCreate';

const styles = StyleSheet.create({
	container: {
		paddingTop: 16
	},
	buttonContainer: {
		paddingBottom: 16
	}
});

const HeaderNewMessage = ({ maxUsers, onChangeText }: { maxUsers: number; onChangeText: (text: string) => void }) => {
	const navigation = useNavigation<NativeStackNavigationProp<NewMessageStackParamList, 'NewMessageView'>>();
	const dispatch = useDispatch();
	const { theme } = useTheme();

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
		navigation.navigate('SelectedUsersViewCreateChannel', { nextAction: () => navigation.navigate('CreateChannelView') });
	}, [navigation]);

	const createTeam = useCallback(() => {
		logEvent(events.NEW_MSG_CREATE_TEAM);
		navigation.navigate('SelectedUsersViewCreateChannel', {
			nextAction: () => navigation.navigate('CreateChannelView', { isTeam: true })
		});
	}, [navigation]);

	const createGroupChat = useCallback(() => {
		logEvent(events.NEW_MSG_CREATE_GROUP_CHAT);
		navigation.navigate('SelectedUsersViewCreateChannel', {
			nextAction: () => dispatch(createChannelRequest({ group: true })),
			buttonText: I18n.t('Create'),
			maxUsers
		});
	}, [dispatch, maxUsers, navigation]);

	const createDiscussion = useCallback(() => {
		logEvent(events.NEW_MSG_CREATE_DISCUSSION);
		Navigation.navigate('CreateDiscussionView');
	}, []);

	return (
		<>
			<View style={[styles.container, { backgroundColor: themes[theme].surfaceHover }]}>
				<View style={styles.buttonContainer}>
					{createPublicChannelPermission || createPrivateChannelPermission ? (
						<ButtonCreate
							onPress={createChannel}
							title={'Channel'}
							icon={'channel-public'}
							testID={'new-message-view-create-channel'}
						/>
					) : null}
					{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.13.0') && createTeamPermission ? (
						<ButtonCreate onPress={createTeam} title={'Team'} icon={'teams'} testID={'new-message-view-create-team'} />
					) : null}
					{maxUsers > 2 && createDirectMessagePermission ? (
						<ButtonCreate
							onPress={createGroupChat}
							title={'Direct_message'}
							icon={'message'}
							testID={'new-message-view-create-direct-message'}
						/>
					) : null}
					{createDiscussionPermission ? (
						<ButtonCreate
							onPress={createDiscussion}
							title={'Discussion'}
							icon={'discussions'}
							testID={'new-message-view-create-discussion'}
						/>
					) : null}
				</View>
			</View>
			<SearchBox onChangeText={(text: string) => onChangeText(text)} testID='new-message-view-search' />
		</>
	);
};

export default HeaderNewMessage;
