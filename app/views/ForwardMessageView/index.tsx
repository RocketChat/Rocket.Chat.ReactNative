import React, { useLayoutEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { StackNavigationOptions } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

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

const ForwardMessageView = () => {
	const [members, setMembers] = useState<string[]>([]);
	const navigation = useNavigation();
	const {
		params: { message }
	} = useRoute<RouteProp<NewMessageStackParamList, 'ForwardMessageView'>>();
	const { theme, colors } = useTheme();

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
		const isSendEnabled = members.length > 0;
		navigation.setOptions({
			title: I18n.t('Create_Discussion'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						title={I18n.t('Send')}
						color={isSendEnabled ? colors.actionTintColor : colors.headerTintColor}
						disabled={!isSendEnabled}
						onPress={() => {}}
						testID='forward-message-view-send'
					/>
				</HeaderButton.Container>
			),
			headerLeft: () => <HeaderButton.CloseModal navigation={navigation} />
		} as StackNavigationOptions);
	}, [members, navigation]);

	const selectUsers = ({ value }: { value: string[] }) => {
		logEvent(events.CD_SELECT_USERS);
		setMembers(prev => [...prev, ...value]);
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
			<SafeAreaView testID='create-discussion-view' style={styles.container}>
				<ScrollView {...scrollPersistTaps}>
					<SelectPersonOrChannel
						server={server}
						userId={user.id}
						token={user.token}
						selected={members}
						onUserSelect={selectUsers}
						blockUnauthenticatedAccess={blockUnauthenticatedAccess}
						serverVersion={serverVersion}
					/>
					<Message
						item={message}
						user={user}
						rid={message.rid}
						baseUrl={baseUrl}
						isThreadRoom={false}
						getCustomEmoji={getCustomEmoji}
						showAttachment={() => {}}
						navToRoomInfo={() => {}}
						theme={theme}
						timeFormat={Message_TimeFormat}
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ForwardMessageView;
