import React, { useLayoutEffect } from 'react';
import { FlatList, Text, View } from 'react-native';

import Message from '../../containers/message';
import ActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import getFileUrlAndTypeFromMessage from './getFileUrlAndTypeFromMessage';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { useActionSheet } from '../../containers/ActionSheet';
import SafeAreaView from '../../containers/SafeAreaView';
import getThreadName from '../../lib/methods/getThreadName';
import styles from './styles';
import { IRoomInfoParam } from '../SearchMessagesView';
import { SubscriptionType, IAttachment, IMessage, TGetCustomEmoji } from '../../definitions';
import { Services } from '../../lib/services';
import AudioManager from '../../lib/methods/AudioManager';
import { IMessagesViewProps, IParams } from './definitions';
import { useAppSelector } from '../../lib/hooks';
import useMessages from './hooks/useMessages';
import getContentTestId from './methods/getContentTestId';
import getEmptyListMessage from './methods/getEmptyListMessage';
import getActionTitle from './methods/getActionTitle';
import getActionIcon from './methods/getActionIcon';
import { TIconsName } from '../../containers/CustomIcon';

const MessagesView = ({ navigation, route }: IMessagesViewProps) => {
	const rid: string = route.params?.rid;
	const t: SubscriptionType = route.params?.t;
	const screenName: string = route.params?.name;
	const testID = getContentTestId({ screenName });
	const emptyListMessage = getEmptyListMessage({ screenName });
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
		const icon = getActionIcon(screenName, message) as TIconsName;
		showActionSheet({
			options: [
				{
					title,
					icon,
					onPress: () => handleActionPress(message)
				}
			],
			hasCancel: true
		});
	};

	const handleActionPress = async (message: IMessage) => {
		try {
			let result: any;
			switch (screenName) {
				case 'Pinned':
					result = await Services.togglePinMessage(message._id, message.pinned);
					break;
				case 'Starred':
					result = await Services.toggleStarMessage(message._id, message.starred);
					break;
			}

			if (result.success) {
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
				<Text style={[styles.noDataFound, { color: themes[theme].fontTitlesLabels }]}>{emptyListMessage}</Text>
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
