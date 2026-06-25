import { useLayoutEffect } from 'react';
import { FlatList, Text, View } from 'react-native';

import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { useActionSheet } from '../../containers/ActionSheet';
import { type IRoomInfoParam } from '../SearchMessagesView';
import { SubscriptionType, type IAttachment, type IMessage, type TGetCustomEmoji } from '../../definitions';
import { type IMessagesViewProps, type IParams } from './definitions';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import Navigation from '../../lib/navigation/appNavigation';
import Message from '../../containers/message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import getFileUrlAndTypeFromMessage from './methods/getFileUrlAndTypeFromMessage';
import AudioManager from '../../lib/methods/AudioManager';
import SafeAreaView from '../../containers/SafeAreaView';
import getThreadName from '../../lib/methods/getThreadName';
import useMessages from './hooks/useMessages';
import { messagesViewContent } from './messagesViewContent';
import styles from './styles';

const MessagesView = ({ navigation, route }: IMessagesViewProps) => {
	const rid: string = route.params?.rid;
	const t: SubscriptionType = route.params?.t;
	const screenName: string = route.params?.name;
	const content = messagesViewContent[screenName];
	const { theme } = useTheme();
	const { showActionSheet } = useActionSheet();
	const isMasterDetail = useMasterDetail();
	const { baseUrl, customEmojis, useRealName, user } = useAppSelector(state => ({
		baseUrl: state.server.server,
		user: getUserSelector(state),
		customEmojis: state.customEmojis,
		useRealName: state.settings.UI_Use_Real_Name as boolean
	}));
	const { messages, loading, loadMore, updateMessageOnActionPress } = useMessages({
		fetchMessages: offset => content.fetch({ rid, t, userId: user.id, offset })
	});

	const handleShowActionSheet = (message: IMessage) => {
		if (!content.action) return;
		showActionSheet({
			options: [
				{
					title: I18n.t(content.action.titleI18n),
					icon: content.action.icon,
					onPress: () => onActionPress(message)
				}
			],
			hasCancel: true
		});
	};

	const onActionPress = async (message: IMessage) => {
		try {
			const result = await content.action?.press(message);

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
			Navigation.popToRoom(isMasterDetail);
			params = {
				...params,
				tmid: item.tmid,
				name: await getThreadName(rid, item.tmid, item._id),
				t: SubscriptionType.THREAD
			};
			Navigation.push('RoomView', params);
		} else {
			Navigation.popToRoom(isMasterDetail);
			Navigation.setParams(params);
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

		return (
			<Message
				{...renderItemCommonProps}
				msg={item.msg}
				theme={theme}
				onLongPress={content.action ? () => handleShowActionSheet(item) : undefined}
			/>
		);
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t(screenName)
		});

		return () => {
			AudioManager.pauseAudio();
		};
	}, []);

	if (!loading && messages.length === 0) {
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].surfaceRoom }]} testID={content.testID}>
				<Text style={[styles.noDataFound, { color: themes[theme].fontTitlesLabels }]}>{I18n.t(content.emptyMessageI18n)}</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID={content.testID}>
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
