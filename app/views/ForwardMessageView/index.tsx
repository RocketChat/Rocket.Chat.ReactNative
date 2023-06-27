import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { StackNavigationOptions } from '@react-navigation/stack';
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';

import { getPermalinkMessage } from '../../lib/methods';
import { TGetCustomEmoji } from '../../definitions';
import KeyboardView from '../../containers/KeyboardView';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { useTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { events, logEvent } from '../../lib/methods/helpers/log';
import styles from './styles';
import SelectPersonOrChannel from './SelectPersonOrChannel';
import { useAppSelector } from '../../lib/hooks';
import Message from '../../containers/message';
import { NewMessageStackParamList } from '../../stacks/types';
import { postMessage } from '../../lib/services/restApi';

const ForwardMessageView = () => {
	const [roomsId, setRoomsId] = useState<string[]>([]);
	const [sending, setSending] = useState(false);
	const navigation = useNavigation();
	const { theme, colors } = useTheme();

	const {
		params: { message }
	} = useRoute<RouteProp<NewMessageStackParamList, 'ForwardMessageView'>>();

	const { blockUnauthenticatedAccess, server, serverVersion, user, baseUrl, Message_TimeFormat, customEmojis } = useAppSelector(
		state => ({
			user: getUserSelector(state),
			server: state.server.server,
			blockUnauthenticatedAccess: !!state.settings.Accounts_AvatarBlockUnauthenticatedAccess ?? true,
			serverVersion: state.server.version as string,
			baseUrl: state.server.server,
			Message_TimeFormat: state.settings.Message_TimeFormat as string,
			customEmojis: state.customEmojis
		})
	);

	useLayoutEffect(() => {
		const isSendButtonEnabled = roomsId.length > 0 && !sending;
		navigation.setOptions({
			title: I18n.t('Forward_message'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						title={I18n.t('Send')}
						color={isSendButtonEnabled ? colors.actionTintColor : colors.headerTintColor}
						disabled={!isSendButtonEnabled}
						onPress={handlePostMessage}
						testID='share-message-view-send'
					/>
				</HeaderButton.Container>
			),
			headerLeft: () => <HeaderButton.CloseModal navigation={navigation} />
		} as StackNavigationOptions);
	}, [roomsId.length, navigation, sending]);

	const handlePostMessage = async () => {
		setSending(true);
		const permalink = await getPermalinkMessage(message);
		const msg = `[ ](${permalink})\n`;
		await Promise.all(roomsId.map(roomId => postMessage(roomId, msg)));
		setSending(false);
		navigation.dispatch(StackActions.pop());
	};

	const selectRooms = ({ value }: { value: string[] }) => {
		logEvent(events.CD_SELECT_USERS);
		setRoomsId(value);
	};

	const getCustomEmoji: TGetCustomEmoji = name => {
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	};

	return (
		<KeyboardView
			style={{ backgroundColor: colors.auxiliaryBackground }}
			contentContainerStyle={styles.container}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<SafeAreaView testID='share-message-view' style={styles.container}>
				<ScrollView {...scrollPersistTaps}>
					<SelectPersonOrChannel
						server={server}
						userId={user.id}
						token={user.token}
						onRoomSelect={selectRooms}
						blockUnauthenticatedAccess={blockUnauthenticatedAccess}
						serverVersion={serverVersion}
					/>
					<View pointerEvents='none'>
						<Message
							item={message}
							user={user}
							rid={message.rid}
							baseUrl={baseUrl}
							getCustomEmoji={getCustomEmoji}
							theme={theme}
							timeFormat={Message_TimeFormat}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ForwardMessageView;
