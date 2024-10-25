import React, { useLayoutEffect } from 'react';
import { FlatList, Text, View } from 'react-native';

import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { useActionSheet } from '../../containers/ActionSheet';
import { IRoomInfoParam } from '../SearchMessagesView';
import { SubscriptionType, IAttachment, IMessage, TGetCustomEmoji } from '../../definitions';
import { IMessagesViewProps, IParams } from './definitions';
import { useAppSelector } from '../../lib/hooks';
import { TIconsName } from '../../containers/CustomIcon';
import Message from '../../containers/message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import getFileUrlAndTypeFromMessage from './methods/getFileUrlAndTypeFromMessage';
import AudioManager from '../../lib/methods/AudioManager';
import SafeAreaView from '../../containers/SafeAreaView';
import getThreadName from '../../lib/methods/getThreadName';
import useMessages from './hooks/useMessages';
import getContentTestId from './methods/getContentTestId';
import getListEmptyMessage from './methods/getListEmptyMessage';
import getActionTitle from './methods/getActionTitle';
import getActionIcon from './methods/getActionIcon';
import performMessageAction from './methods/performMessageAction';
import styles from './styles';

const MessagesView = ({ navigation, route }: IMessagesViewProps) => {
	const rid: string = route.params?.rid;
	const t: SubscriptionType = route.params?.t;
	const screenName: string = route.params?.name;
	const testID = getContentTestId({ screenName });
	const listEmptyMessage = getListEmptyMessage({ screenName });
	const { theme } = useTheme();
	const { showActionSheet } = useActionSheet();
	const { baseUrl, customEmojis, isMasterDetail, useRealName, user } = useAppSelector(state => ({
		baseUrl: state.server.server,
		user: getUserSelector(state),
		customEmojis: state.customEmojis,
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		isMasterDetail: state.app.isMasterDetail
	}));
	const { messages, loading, loadMore, updateMessageOnActionPress } = useMessages({ rid, t, screenName, userId: user.id });

	const setHeader = () => {
		navigation.setOptions({
			title: I18n.t(screenName)
		});
	};

	const handleShowActionSheet = (message: IMessage) => {
		const title = getActionTitle(screenName) as string;
		const icon = getActionIcon(screenName) as TIconsName;
		showActionSheet({
			options: [
				{
					title,
					icon,
					onPress: () => onActionPress(message)
				}
			],
			hasCancel: true
		});
	};

	const onActionPress = async (message: IMessage) => {
		try {
			const result = await performMessageAction(screenName, message);

			if (result?.success) {
				updateMessageOnActionPress(message?._id);
			}
		} catch {
			// Do nothing
		}
	};

	const showAttachment = (attachment: IAttachment) => {
		navigation.navigate('AttachmentView', { attachment });
	};

	const navToRoomInfo = (navParam: IRoomInfoParam) => {
		navigation.navigate('RoomInfoView', navParam);
	};

	const jumpToMessage = async ({ item }: { item: IMessage }) => {
		let params: IParams = {
			rid,
			jumpToMessageId: item._id,
			t
		};

		if (item.tmid) {
			if (isMasterDetail) {
				navigation.navigate('DrawerNavigator');
			} else {
				navigation.pop(2);
			}
			params = {
				...params,
				tmid: item.tmid,
				name: await getThreadName(rid, item.tmid, item._id),
				t: SubscriptionType.THREAD
			};
			navigation.push('RoomView', params);
		} else {
			navigation.navigate('RoomView', params);
		}
	};

	const getCustomEmoji: TGetCustomEmoji = name => {
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	const renderItem = ({ item }: { item: any }) => {
		const renderItemCommonProps = {
			item,
			baseUrl,
			user,
			author: item.u || item.user,
			timeFormat: 'MMM Do YYYY, h:mm:ss a',
			isEdited: !!item.editedAt,
			isHeader: true,
			isThreadRoom: true,
			attachments: item.attachments || [],
			useRealName,
			showAttachment,
			getCustomEmoji,
			navToRoomInfo,
			onPress: () => jumpToMessage({ item }),
			rid
		};

		if (screenName === 'Files') {
			return (
				<Message
					{...renderItemCommonProps}
					theme={theme}
					item={{
						...item,
						u: item.user,
						ts: item.ts || item.uploadedAt,
						attachments: [
							{
								title: item.name,
								description: item.description,
								...item,
								...getFileUrlAndTypeFromMessage(item)
							}
						]
					}}
				/>
			);
		}

		if (screenName === 'Pinned' || screenName === 'Starred') {
			return <Message {...renderItemCommonProps} msg={item.msg} theme={theme} onLongPress={() => handleShowActionSheet(item)} />;
		}

		return <Message {...renderItemCommonProps} msg={item.msg} theme={theme} />;
	};

	useLayoutEffect(() => {
		setHeader();

		return () => {
			AudioManager.pauseAudio();
		};
	}, []);

	if (!loading && messages.length === 0) {
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].surfaceRoom }]} testID={testID}>
				<Text style={[styles.noDataFound, { color: themes[theme].fontTitlesLabels }]}>{listEmptyMessage}</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID={testID}>
			<StatusBar />
			<FlatList
				data={messages}
				renderItem={renderItem}
				style={[styles.list, { backgroundColor: themes[theme].surfaceRoom }]}
				keyExtractor={item => item._id}
				onEndReached={loadMore}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
			/>
		</SafeAreaView>
	);
};

export default MessagesView;
