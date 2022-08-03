import { Q } from '@nozbe/watermelondb';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { shallowEqual, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { createChannelRequest } from '../actions/createChannel';
import { themes } from '../lib/constants';
import * as HeaderButton from '../containers/HeaderButton';
import * as List from '../containers/List';
import SafeAreaView from '../containers/SafeAreaView';
import SearchBox from '../containers/SearchBox';
import StatusBar from '../containers/StatusBar';
import { ISearch, TSubscriptionModel } from '../definitions';
import I18n from '../i18n';
import database from '../lib/database';
import { CustomIcon, TIconsName } from '../containers/CustomIcon';
import Navigation from '../lib/navigation/appNavigation';
import UserItem from '../containers/UserItem';
import { TSupportedThemes, useTheme } from '../theme';
import { goRoom as goRoomMethod, TGoRoomItem } from '../lib/methods/helpers/goRoom';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import Touch from '../lib/methods/helpers/touch';
import sharedStyles from './Styles';
import { NewMessageStackParamList } from '../stacks/types';
import { search as searchMethod } from '../lib/methods';
import { hasPermission, compareServerVersion } from '../lib/methods/helpers';
import { PADDING_HORIZONTAL } from '../containers/List/constants';
import { useAppSelector } from '../lib/hooks';

const QUERY_SIZE = 50;

const styles = StyleSheet.create({
	button: {
		height: 46,
		flexDirection: 'row',
		alignItems: 'center'
	},
	buttonIcon: {
		marginLeft: 18,
		marginRight: 16
	},
	buttonText: {
		fontSize: 17,
		...sharedStyles.textRegular
	},
	buttonContainer: {
		paddingBottom: 16
	},
	rightContainer: {
		paddingLeft: PADDING_HORIZONTAL,
		alignItems: 'flex-end',
		flex: 1
	}
});

interface IButton {
	onPress: () => void;
	testID: string;
	title: string;
	icon: TIconsName;
	first?: boolean;
}

type TItem = ISearch | TSubscriptionModel;

interface IRenderItem {
	item: TItem;
	index: number;
	search: TItem[];
	chats: TSubscriptionModel[];
	useRealName: boolean;
	goRoom: (item: TGoRoomItem) => void;
}

const RenderItem = ({ item, index, chats, search, useRealName, goRoom }: IRenderItem) => {
	const { theme } = useTheme();

	let style = { borderColor: themes[theme].separatorColor };
	if (index === 0) {
		style = { ...style };
	}
	if (search.length > 0 && index === search.length - 1) {
		style = { ...style, ...sharedStyles.separatorBottom };
	}
	if (search.length === 0 && index === chats.length - 1) {
		style = { ...style, ...sharedStyles.separatorBottom };
	}

	const itemSearch = item as ISearch;
	const itemModel = item as TSubscriptionModel;

	return (
		<UserItem
			name={useRealName && itemSearch.fname ? itemSearch.fname : itemModel.name}
			username={itemSearch.search ? itemSearch.username : itemModel.name}
			onPress={() => goRoom(itemModel)}
			testID={`new-message-view-item-${item.name}`}
			style={style}
			theme={theme}
		/>
	);
};

const RenderButton = ({ onPress, testID, title, icon, first }: IButton) => {
	const { theme } = useTheme();

	return (
		<Touch onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }} testID={testID} theme={theme}>
			<View
				style={[
					first ? sharedStyles.separatorVertical : sharedStyles.separatorBottom,
					styles.button,
					{ borderColor: themes[theme].separatorColor }
				]}>
				<CustomIcon name={icon} size={24} color={themes[theme].bodyText} style={styles.buttonIcon} />
				<Text style={[styles.buttonText, { color: themes[theme].bodyText }]}>{title}</Text>
				<View style={styles.rightContainer}>
					<CustomIcon name={'chevron-right'} size={24} color={themes[theme].bodyText} style={styles.buttonIcon} />
				</View>
			</View>
		</Touch>
	);
};

const Header = ({
	maxUsers,
	theme,
	onChangeText
}: {
	maxUsers: number;
	theme: TSupportedThemes;
	onChangeText: (text: string) => void;
}) => {
	const [permissions, setPermissions] = useState<boolean[]>([]);
	const navigation = useNavigation<StackNavigationProp<NewMessageStackParamList, 'NewMessageView'>>();
	const dispatch = useDispatch();

	const {
		serverVersion,
		createTeamPermission,
		createDirectMessagePermission,
		createPublicChannelPermission,
		createPrivateChannelPermission,
		createDiscussionPermission
	} = useAppSelector(
		state => ({
			serverVersion: state.server.version as string,
			createTeamPermission: state.permissions['create-team'],
			createDirectMessagePermission: state.permissions['create-d'],
			createPublicChannelPermission: state.permissions['create-c'],
			createPrivateChannelPermission: state.permissions['create-p'],
			createDiscussionPermission: state.permissions['start-discussion']
		}),
		shallowEqual
	);

	useEffect(() => {
		const getPermissions = async () => {
			const permissionsToCreate = await hasPermission([
				createPublicChannelPermission,
				createPrivateChannelPermission,
				createTeamPermission,
				createDirectMessagePermission,
				createDiscussionPermission
			]);
			setPermissions(permissionsToCreate);
		};

		getPermissions();
	}, [
		createDirectMessagePermission,
		createDiscussionPermission,
		createPrivateChannelPermission,
		createPublicChannelPermission,
		createTeamPermission
	]);

	const createChannel = () => {
		logEvent(events.NEW_MSG_CREATE_CHANNEL);
		navigation.navigate('SelectedUsersViewCreateChannel', { nextAction: () => navigation.navigate('CreateChannelView') });
	};

	const createTeam = () => {
		logEvent(events.NEW_MSG_CREATE_TEAM);
		navigation.navigate('SelectedUsersViewCreateChannel', {
			nextAction: () => navigation.navigate('CreateChannelView', { isTeam: true })
		});
	};

	const createGroupChat = () => {
		logEvent(events.NEW_MSG_CREATE_GROUP_CHAT);
		navigation.navigate('SelectedUsersViewCreateChannel', {
			nextAction: () => dispatch(createChannelRequest({ group: true })),
			buttonText: I18n.t('Create'),
			maxUsers
		});
	};

	const createDiscussion = () => {
		logEvent(events.NEW_MSG_CREATE_DISCUSSION);
		Navigation.navigate('CreateDiscussionView');
	};

	return (
		<>
			<View style={{ backgroundColor: themes[theme].auxiliaryBackground, paddingTop: 16 }}>
				<View style={styles.buttonContainer}>
					{permissions[0] || permissions[1] ? (
						<RenderButton
							onPress={createChannel}
							title={I18n.t('Create_Channel')}
							icon={'channel-public'}
							testID={'new-message-view-create-channel'}
							first={true}
						/>
					) : null}
					{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.13.0') && permissions[2] ? (
						<RenderButton
							onPress={createTeam}
							title={I18n.t('Create_Team')}
							icon={'teams'}
							testID={'new-message-view-create-team'}
						/>
					) : null}
					{maxUsers > 2 && permissions[3] ? (
						<RenderButton
							onPress={createGroupChat}
							title={I18n.t('Create_Direct_Messages')}
							icon={'message'}
							testID={'new-message-view-create-direct-message'}
						/>
					) : null}
					{permissions[4] ? (
						<RenderButton
							onPress={createDiscussion}
							title={I18n.t('Create_Discussion')}
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

const NewMessageView = () => {
	const [chats, setChats] = useState<TSubscriptionModel[]>([]);
	const [search, setSearch] = useState<TItem[]>([]);

	const { colors, theme } = useTheme();

	const navigation = useNavigation<StackNavigationProp<NewMessageStackParamList, 'NewMessageView'>>();

	const { isMasterDetail, maxUsers, useRealName } = useAppSelector(
		state => ({
			isMasterDetail: state.app.isMasterDetail,
			maxUsers: (state.settings.DirectMesssage_maxUsers as number) || 1,
			useRealName: state.settings.UI_Use_Real_Name as boolean
		}),
		shallowEqual
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HeaderButton.CloseModal navigation={navigation} testID='new-message-view-close' />,
			title: I18n.t('New_Message')
		});
	}, [navigation]);

	useEffect(() => {
		const init = async () => {
			try {
				const db = database.active;
				const c = await db
					.get('subscriptions')
					.query(Q.where('t', 'd'), Q.experimentalTake(QUERY_SIZE), Q.experimentalSortBy('room_updated_at', Q.desc))
					.fetch();
				setChats(c);
			} catch (e) {
				log(e);
			}
		};

		init();
	}, []);

	const handleSearch = useCallback(async (text: string) => {
		const result = (await searchMethod({ text, filterRooms: false })) as ISearch[];
		setSearch(result);
	}, []);

	const goRoom = useCallback(
		(item: TGoRoomItem) => {
			logEvent(events.NEW_MSG_CHAT_WITH_USER);

			if (isMasterDetail) {
				navigation.pop();
			}
			goRoomMethod({ item, isMasterDetail });
		},
		[isMasterDetail, navigation]
	);

	return (
		<SafeAreaView testID='new-message-view'>
			<StatusBar />
			<FlatList
				data={search.length > 0 ? search : chats}
				keyExtractor={item => item._id || item.rid}
				ListHeaderComponent={<Header maxUsers={maxUsers} theme={theme} onChangeText={handleSearch} />}
				renderItem={({ item, index }) => (
					<RenderItem goRoom={goRoom} chats={chats} index={index} item={item} search={search} useRealName={useRealName} />
				)}
				ItemSeparatorComponent={List.Separator}
				contentContainerStyle={{ backgroundColor: colors.backgroundColor }}
				keyboardShouldPersistTaps='always'
			/>
		</SafeAreaView>
	);
};

export default NewMessageView;
