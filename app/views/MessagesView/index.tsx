import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { getUserSelector } from '../../selectors/login';
import { SubscriptionType, IAttachment, IMessage, TAnyMessageModel, TGetCustomEmoji } from '../../definitions';
import { IRoomInfoParam } from '../SearchMessagesView';
import { Services } from '../../lib/services';
import { Encryption } from '../../lib/encryption';
import { useAppSelector } from '../../lib/hooks';
import { useActionSheet } from '../../containers/ActionSheet';
import { TMessagesViewProps, TMessageViewContent, TParams } from './types';
import getFileUrlAndTypeFromMessage from './getFileUrlAndTypeFromMessage';
import I18n from '../../i18n';
import Message from '../../containers/message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import getThreadName from '../../lib/methods/getThreadName';
import useMessages from './hooks/useMessages';
import styles from './styles';

const MessagesView = ({ navigation, route }: TMessagesViewProps) => {
	const rid: string = route.params?.rid;
	const t: SubscriptionType = route.params?.t;
	let room: any;

	const { showActionSheet } = useActionSheet();
	const { theme } = useTheme();
	const { baseUrl, customEmojis, isMasterDetail, useRealName, user } = useAppSelector(state => ({
		baseUrl: state.server.server,
		user: getUserSelector(state),
		customEmojis: state.customEmojis,
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		isMasterDetail: state.app.isMasterDetail
	}));

	const setHeader = () => {
		navigation.setOptions({
			title: I18n.t(route.params?.name)
		});
	};

	const getCustomEmoji: TGetCustomEmoji = name => {
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	const defineMessagesViewContent = (name: string) => {
		const renderItemCommonProps = (item: TAnyMessageModel) => ({
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
		});

		return {
			// Files Messages Screen
			Files: {
				name: I18n.t('Files'),
				fetchFunc: async () => {
					const result = await Services.getFiles(rid, t, messages.length);
					if (result.success) {
						return { ...result, messages: await Encryption.decryptFiles(result.files) };
					}
				},
				noDataMsg: I18n.t('No_files'),
				testID: 'room-files-view',
				renderItem: (item: any) => (
					<Message
						{...renderItemCommonProps(item)}
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
				)
			},
			// Mentions Messages Screen
			Mentions: {
				name: I18n.t('Mentions'),
				fetchFunc: () => Services.getMessages(rid, t, { 'mentions._id': { $in: [user.id] } }, messages.length),
				noDataMsg: I18n.t('No_mentioned_messages'),
				testID: 'mentioned-messages-view',
				renderItem: (item: TAnyMessageModel) => <Message {...renderItemCommonProps(item)} msg={item.msg} theme={theme} />
			},
			// Starred Messages Screen
			Starred: {
				name: I18n.t('Starred'),
				fetchFunc: () => Services.getMessages(rid, t, { 'starred._id': { $in: [user.id] } }, messages.length),
				noDataMsg: I18n.t('No_starred_messages'),
				testID: 'starred-messages-view',
				renderItem: (item: TAnyMessageModel) => (
					<Message {...renderItemCommonProps(item)} msg={item.msg} onLongPress={() => onLongPress(item)} theme={theme} />
				),
				action: (message: IMessage) => ({
					title: I18n.t('Unstar'),
					icon: message.starred ? 'star-filled' : 'star',
					onPress: handleActionPress
				}),
				handleActionPress: (message: IMessage) => Services.toggleStarMessage(message._id, message.starred)
			},
			// Pinned Messages Screen
			Pinned: {
				name: I18n.t('Pinned'),
				fetchFunc: () => Services.getMessages(rid, t, { pinned: true }, messages.length),
				noDataMsg: I18n.t('No_pinned_messages'),
				testID: 'pinned-messages-view',
				renderItem: (item: TAnyMessageModel) => (
					<Message {...renderItemCommonProps(item)} msg={item.msg} onLongPress={() => onLongPress(item)} theme={theme} />
				),
				action: () => ({ title: I18n.t('Unpin'), icon: 'pin', onPress: handleActionPress }),
				handleActionPress: (message: IMessage) => Services.togglePinMessage(message._id, message.pinned)
			}
		}[name];
	};

	const content: TMessageViewContent | any = defineMessagesViewContent(route.params.name);

	const [message, setMessage] = useState<IMessage>({} as IMessage);

	const navToRoomInfo = (navParam: IRoomInfoParam) => {
		navigation.navigate('RoomInfoView', navParam);
	};

	const showAttachment = (attachment: IAttachment) => {
		navigation.navigate('AttachmentView', { attachment });
	};

	const jumpToMessage = async ({ item }: { item: IMessage }) => {
		let params: TParams = {
			rid,
			jumpToMessageId: item._id,
			t,
			room
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

	// ActionSheet
	const onLongPress = (message: IMessage) => {
		setMessage(message);
		handleShowActionSheet(message);
	};

	const handleShowActionSheet = (message?: IMessage) => {
		showActionSheet({ options: [content.action(message)], hasCancel: true });
	};

	const handleActionPress = async () => {
		try {
			const result = await content.handleActionPress(message);
			if (result.success) {
				updateMessagesOnActionPress(message?._id);
			}
		} catch {
			// Do nothing
		}
	};

	const renderItem = ({ item }: { item: IMessage }) => content?.renderItem(item);

	const { loading, messages, loadMore, updateMessagesOnActionPress } = useMessages({ setHeader, fetchFunc: content?.fetchFunc });

	if (!loading && messages.length === 0) {
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].surfaceRoom }]} testID={content?.testID}>
				<Text style={[styles.noDataFound, { color: themes[theme].fontTitlesLabels }]}>{content?.noDataMsg}</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID={content?.testID}>
			<StatusBar />
			<FlatList
				extraData={content}
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
