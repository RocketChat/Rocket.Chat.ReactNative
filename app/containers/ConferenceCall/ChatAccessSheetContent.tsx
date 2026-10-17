import { type ReactElement, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useActionSheet } from '~/containers/ActionSheet';
import Button from '~/containers/Button';
import { type VideoConferenceChatAccessMode } from '~/definitions/IVideoConference';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { getChatAccessActions } from '~/lib/methods/helpers/getChatAccessActions';
import { getMembersWithoutChatAccess } from '~/lib/methods/helpers/getMembersWithoutChatAccess';
import { showErrorAlertWithEMessage } from '~/lib/methods/helpers/info';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { videoConferenceShareChat } from '~/lib/services/restApi';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ConferenceSheetHeader from './ConferenceSheetHeader';
import ConferenceUserRow from './ConferenceUserRow';

const ACTION_TITLE: Record<VideoConferenceChatAccessMode, string> = {
	invite: 'Add_to_room',
	discussion: 'Create_Discussion'
};

const ACTION_DESCRIPTION: Record<VideoConferenceChatAccessMode, string> = {
	invite: 'Chat_access_add_to_room_description',
	discussion: 'Chat_access_create_discussion_description'
};

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	section: {
		paddingHorizontal: 24,
		paddingTop: 16
	},
	intro: {
		...sharedStyles.textRegular,
		fontSize: 14,
		lineHeight: 20,
		paddingHorizontal: 24,
		paddingBottom: 8
	},
	actionTitle: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	},
	actionDescription: {
		...sharedStyles.textRegular,
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 12
	}
});

const ChatAccessSheetContent = (): ReactElement => {
	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();
	const callId = useConferenceCallStore(state => state.callId);
	const { info } = useConferenceInfo(callId, { live: true });
	const [applying, setApplying] = useState<VideoConferenceChatAccessMode>();

	const chatAccess = info?.chatAccess;
	const members = chatAccess ? getMembersWithoutChatAccess(info.users, chatAccess.membersWithoutAccess) : [];
	const actions = chatAccess ? getChatAccessActions(chatAccess) : [];

	const apply = async (mode: VideoConferenceChatAccessMode) => {
		if (!callId) {
			return;
		}
		setApplying(mode);
		try {
			await videoConferenceShareChat(callId, mode);
			hideActionSheet();
		} catch (error) {
			showErrorAlertWithEMessage(error);
			setApplying(undefined);
		}
	};

	const actionsFooter = (
		<>
			{actions.map((mode, index) => (
				<View key={mode} style={styles.section}>
					<Text style={[styles.actionTitle, { color: colors.fontTitlesLabels }]}>{I18n.t(ACTION_TITLE[mode])}</Text>
					<Text style={[styles.actionDescription, { color: colors.fontHint }]}>
						{I18n.t(ACTION_DESCRIPTION[mode], { roomName: chatAccess?.name })}
					</Text>
					<Button
						title={I18n.t(ACTION_TITLE[mode])}
						type={index === 0 ? 'primary' : 'secondary'}
						loading={applying === mode}
						disabled={applying !== undefined}
						onPress={() => apply(mode)}
						testID={`conference-chat-access-${mode}`}
					/>
				</View>
			))}
		</>
	);

	return (
		<View style={styles.container} testID='conference-chat-access-sheet'>
			<ConferenceSheetHeader title={I18n.t('Chat_access')} onClose={hideActionSheet} />
			<FlatList
				data={members}
				keyExtractor={({ _id }) => _id}
				ListHeaderComponent={
					<Text style={[styles.intro, { color: colors.fontDefault }]}>{I18n.t('Chat_access_description')}</Text>
				}
				renderItem={({ item }) => (
					<ConferenceUserRow
						userId={item._id}
						name={item.name}
						username={item.username}
						testID={`conference-chat-access-member-${item._id}`}
					/>
				)}
				ListFooterComponent={actionsFooter}
			/>
		</View>
	);
};

export default ChatAccessSheetContent;
