import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { StackNavigationOptions } from '@react-navigation/stack';
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';

import { getPermalinkMessage } from '../../lib/methods';
import { TAnyMessageModel, TGetCustomEmoji } from '../../definitions';
import KeyboardView from '../../containers/KeyboardView';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import styles from './styles';
import SelectPersonOrChannel from './SelectPersonOrChannel';
import { useAppSelector } from '../../lib/hooks';
import Message from '../../containers/message';
import { NewMessageStackParamList } from '../../stacks/types';
import { postMessage } from '../../lib/services/restApi';

const ForwardMessageView = () => {
	const [rooms, setRooms] = useState<string[]>([]);
	const [sending, setSending] = useState(false);
	const navigation = useNavigation();
	const { theme, colors } = useTheme();

	const {
		params: { message }
	} = useRoute<RouteProp<NewMessageStackParamList, 'ForwardMessageView'>>();

	const { blockUnauthenticatedAccess, server, serverVersion, user, baseUrl, Message_TimeFormat, customEmojis, useRealName } =
		useAppSelector(state => ({
			user: getUserSelector(state),
			server: state.server.server,
			blockUnauthenticatedAccess: !!state.settings.Accounts_AvatarBlockUnauthenticatedAccess ?? true,
			serverVersion: state.server.version as string,
			baseUrl: state.server.server,
			Message_TimeFormat: state.settings.Message_TimeFormat as string,
			customEmojis: state.customEmojis,
			useRealName: state.settings.UI_Use_Real_Name as boolean
		}));

	useLayoutEffect(() => {
		const isSendButtonEnabled = rooms.length > 0 && !sending;
		navigation.setOptions({
			title: I18n.t('Forward_message'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						title={I18n.t('Send')}
						color={isSendButtonEnabled ? colors.actionTintColor : colors.headerTintColor}
						disabled={!isSendButtonEnabled}
						onPress={handlePostMessage}
						testID='forward-message-view-send'
					/>
				</HeaderButton.Container>
			),
			headerLeft: () => <HeaderButton.CloseModal navigation={navigation} />
		} as StackNavigationOptions);
	}, [rooms.length, navigation, sending]);

	const handlePostMessage = async () => {
		setSending(true);
		const permalink = await getPermalinkMessage(message);
		const msg = `[ ](${permalink})\n`;
		await Promise.all(rooms.map(roomId => postMessage(roomId, msg)));
		setSending(false);
		navigation.dispatch(StackActions.pop());
	};

	const selectRooms = ({ value }: { value: string[] }) => {
		setRooms(value);
	};

	const getCustomEmoji: TGetCustomEmoji = name => {
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	const cleanUpMessage = () => {
		const messageToBeCleaned = message.asPlain();
		if (messageToBeCleaned.t === 'discussion-created') {
			// set the message type as null to avoid show the discussion started
			// @ts-ignore
			messageToBeCleaned.t = null;
		}
		// set to undefined to avoid show the reactions
		messageToBeCleaned.reactions = undefined;
		// set to undefined to avoid show the button reply to a thread
		messageToBeCleaned.tlm = undefined;
		// set to undefined to avoid show as showing a thread sequential with small avatar and text
		messageToBeCleaned.tmid = undefined;
		return messageToBeCleaned as TAnyMessageModel;
	};

	return (
		<KeyboardView
			style={{ backgroundColor: colors.auxiliaryBackground }}
			contentContainerStyle={styles.container}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<SafeAreaView testID='forward-message-view' style={styles.container}>
				<ScrollView {...scrollPersistTaps}>
					<SelectPersonOrChannel
						server={server}
						userId={user.id}
						token={user.token}
						onRoomSelect={selectRooms}
						blockUnauthenticatedAccess={blockUnauthenticatedAccess}
						serverVersion={serverVersion}
					/>
					<View pointerEvents='none' style={[styles.messageContainer, { backgroundColor: colors.backgroundColor }]}>
						<Message
							item={cleanUpMessage()}
							user={user}
							rid={message.rid}
							baseUrl={baseUrl}
							getCustomEmoji={getCustomEmoji}
							theme={theme}
							timeFormat={Message_TimeFormat}
							useRealName={useRealName}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ForwardMessageView;
