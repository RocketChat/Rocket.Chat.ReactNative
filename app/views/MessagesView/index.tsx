import { useEffect, useLayoutEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Message from '~/containers/message';
import { MessageRoomProvider } from '~/containers/message/stores/MessageRoomStore';
import { A11yGateProvider } from '~/containers/message/stores/A11yGate';
import ActivityIndicator from '~/containers/ActivityIndicator';
import { useActionSheet } from '~/containers/ActionSheet';
import SafeAreaView from '~/containers/SafeAreaView';
import I18n from '~/i18n';
import { useTheme } from '~/theme';
import { getUserSelector } from '~/selectors/login';
import { SubscriptionType, type IAttachment, type IMessage, type IRoomInfoParam } from '~/definitions';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import Navigation from '~/lib/navigation/appNavigation';
import AudioManager from '~/lib/methods/AudioManager';
import getThreadName from '~/lib/methods/getThreadName';
import log from '~/lib/methods/helpers/log';
import { type IMessagesViewProps, type IParams } from './definitions';
import getFileUrlAndTypeFromMessage from './methods/getFileUrlAndTypeFromMessage';
import useMessages from './hooks/useMessages';
import { messagesViewContent } from './messagesViewContent';
import styles from './styles';

const TIME_FORMAT = 'MMM Do YYYY, h:mm:ss a';

const MessagesView = ({ navigation, route }: IMessagesViewProps) => {
	const { rid, t, name: screenName } = route.params;
	const content = messagesViewContent[screenName];
	const { colors } = useTheme();
	const { showActionSheet } = useActionSheet();
	const isMasterDetail = useMasterDetail();
	const insets = useSafeAreaInsets();
	const userId = useAppSelector(state => getUserSelector(state).id);
	const { messages, loading, loadMore, removeMessage } = useMessages({ rid, t, userId, screenName });

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t(screenName) });
	}, [navigation, screenName]);

	useEffect(() => () => AudioManager.pauseAudio(), []);

	const onActionPress = async (message: IMessage) => {
		try {
			const result = await content.action?.press(message);
			if (result?.success) {
				removeMessage(message._id);
			}
		} catch (error) {
			log(error);
		}
	};

	const showMessageActions = (message: IMessage) => {
		if (!content.action) return;
		showActionSheet({
			options: [{ title: I18n.t(content.action.titleI18n), icon: content.action.icon, onPress: () => onActionPress(message) }],
			hasCancel: true
		});
	};

	const showAttachment = (attachment: IAttachment) => {
		navigation.navigate('AttachmentView', { attachment });
	};

	const navToRoomInfo = (navParam: IRoomInfoParam) => {
		navigation.navigate('RoomInfoView', navParam);
	};

	const jumpToMessage = async (item: IMessage) => {
		Navigation.popToRoom(isMasterDetail);
		const params: IParams = { rid, t, jumpToMessageId: item._id };
		if (item.tmid) {
			Navigation.push('RoomView', {
				...params,
				tmid: item.tmid,
				name: await getThreadName(rid, item.tmid, item._id),
				t: SubscriptionType.THREAD
			});
			return;
		}
		Navigation.setParams(params);
	};

	const renderItem = ({ item }: { item: any }) => {
		if (screenName === 'Files') {
			return (
				<Message
					item={{
						...item,
						u: item.user,
						ts: item.ts || item.uploadedAt,
						attachments: [{ title: item.name, description: item.description, ...item, ...getFileUrlAndTypeFromMessage(item) }]
					}}
					onPress={() => jumpToMessage(item)}
				/>
			);
		}
		return (
			<Message
				item={item}
				onPress={() => jumpToMessage(item)}
				onLongPress={content.action ? () => showMessageActions(item) : undefined}
			/>
		);
	};

	if (!loading && messages.length === 0) {
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: colors.surfaceRoom }]} testID={content.testID}>
				<Text style={[styles.noDataFound, { color: colors.fontTitlesLabels }]}>{I18n.t(content.emptyMessageI18n)}</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID={content.testID}>
			<A11yGateProvider>
				<MessageRoomProvider handlers={{ navToRoomInfo, showAttachment }} rid={rid} isThreadRoom timeFormat={TIME_FORMAT}>
					<FlatList
						data={messages}
						renderItem={renderItem}
						style={[styles.list, { backgroundColor: colors.surfaceRoom }]}
						keyExtractor={item => item._id}
						onEndReached={loadMore}
						contentContainerStyle={{ paddingBottom: insets.bottom }}
						ListFooterComponent={loading ? <ActivityIndicator /> : null}
					/>
				</MessageRoomProvider>
			</A11yGateProvider>
		</SafeAreaView>
	);
};

export default MessagesView;
