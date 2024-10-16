import React, { useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';

import { getPermalinkMessage } from '../../lib/methods';
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
import { NewMessageStackParamList } from '../../stacks/types';
import { postMessage } from '../../lib/services/restApi';
import MessagePreview from '../../containers/message/Preview';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';

const ForwardMessageView = () => {
	const [rooms, setRooms] = useState<string[]>([]);
	const [sending, setSending] = useState(false);
	const navigation = useNavigation();
	const { colors } = useTheme();

	const {
		params: { message }
	} = useRoute<RouteProp<NewMessageStackParamList, 'ForwardMessageView'>>();

	const { blockUnauthenticatedAccess, server, serverVersion, user } = useAppSelector(state => ({
		user: getUserSelector(state),
		server: state.server.server,
		blockUnauthenticatedAccess: !!state.settings.Accounts_AvatarBlockUnauthenticatedAccess ?? true,
		serverVersion: state.server.version as string
	}));

	useLayoutEffect(() => {
		const isSendButtonEnabled = rooms.length && !sending;
		navigation.setOptions({
			title: I18n.t('Forward_message'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						title={I18n.t('Send')}
						color={isSendButtonEnabled ? colors.fontHint : colors.fontSecondaryInfo}
						disabled={!isSendButtonEnabled}
						onPress={handlePostMessage}
						testID='forward-message-view-send'
					/>
				</HeaderButton.Container>
			),
			headerLeft: () => <HeaderButton.CloseModal />
		});
	}, [rooms.length, navigation, sending]);

	const handlePostMessage = async () => {
		setSending(true);
		const permalink = await getPermalinkMessage(message);
		const msg = `[ ](${permalink})\n`;
		try {
			await Promise.all(rooms.map(roomId => postMessage(roomId, msg)));
			EventEmitter.emit(LISTENER, { message: I18n.t('Message_has_been_shared') });
			navigation.dispatch(StackActions.pop());
		} catch (e: any) {
			Alert.alert(I18n.t('Oops'), e.message);
		}
		setSending(false);
	};

	const selectRooms = ({ value }: { value: string[] }) => {
		setRooms(value);
	};

	return (
		<KeyboardView
			style={{ backgroundColor: colors.surfaceHover }}
			contentContainerStyle={styles.container}
			keyboardVerticalOffset={128}>
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
					<View pointerEvents='none' style={[styles.messageContainer, { backgroundColor: colors.surfaceRoom }]}>
						<MessagePreview message={message} />
					</View>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ForwardMessageView;
