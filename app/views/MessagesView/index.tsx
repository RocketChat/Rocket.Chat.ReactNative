import React from 'react';
import { FlatList, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { SubscriptionType, IMessage, TGetCustomEmoji, TAnyMessageModel } from '../../definitions';
import { IMessagesViewProps, IMessageViewContent } from './definitions';
import I18n from '../../i18n';
import ActivityIndicator from '../../containers/ActivityIndicator';
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import useMessages from './hooks/useMessages';
import styles from './styles';
import useMessagesContent from './hooks/useMessagesActions';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';
import { Services } from '../../lib/services';
import { Encryption } from '../../lib/encryption';
import Message from '../../containers/message';
import getFileUrlAndTypeFromMessage from './getFileUrlAndTypeFromMessage';

const MessagesView = ({ navigation, route }: IMessagesViewProps) => {
	const routeName: string = route.params.name;
	const rid: string = route.params?.rid;
	const t: SubscriptionType = route.params?.t;
	let room: any;
	const { theme } = useTheme();
	const { baseUrl, customEmojis, isMasterDetail, useRealName, user } = useAppSelector(state => ({
		baseUrl: state.server.server,
		user: getUserSelector(state),
		customEmojis: state.customEmojis,
		useRealName: state.settings.UI_Use_Real_Name as boolean,
		isMasterDetail: state.app.isMasterDetail
	}));

	const getCustomEmoji: TGetCustomEmoji = name => {
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	const setHeader = () => {
		navigation.setOptions({
			title: I18n.t(route.params?.name)
		});
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
					onPress: () => handleActionPress('STAR', message)
				})
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
				action: (message: IMessage) => ({
					title: I18n.t('Unpin'),
					icon: 'pin',
					onPress: () => handleActionPress('PIN', message)
				})
			}
		}[name];
	};

	const content: IMessageViewContent | any = defineMessagesViewContent(routeName);

	const { loading, messages, loadMore, updateMessagesOnActionPress } = useMessages({ setHeader, fetchFunc: content.fetchFunc });
	const { handleActionPress, onLongPress, jumpToMessage, navToRoomInfo, showAttachment } = useMessagesContent({
		content,
		isMasterDetail,
		navigation,
		rid,
		room,
		t,
		updateMessagesOnActionPress
	});

	const renderItem = ({ item }: { item: IMessage }) => content?.renderItem(item);

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
