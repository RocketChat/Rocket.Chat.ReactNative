import { RoomContext, useParticipants } from '@livekit/react-native';
import { type ReactElement, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useActionSheet } from '~/containers/ActionSheet';
import { CustomIcon } from '~/containers/CustomIcon';
import Touch from '~/containers/Touch';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { type TConferenceInfoResult, useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { groupConferenceMembers, nextRingingLapse } from '~/lib/methods/helpers/groupConferenceMembers';
import log from '~/lib/methods/helpers/log';
import { orderRaisedHands } from '~/lib/services/conference/callDataProtocol';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { useConferenceInteractionStore } from '~/lib/services/conference/useConferenceInteractionStore';
import { useConferenceRoomStore } from '~/lib/services/conference/useConferenceRoomStore';
import { videoConferenceRing } from '~/lib/services/restApi';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ConferenceControlButton, { COMPACT_BUTTON_SIZE } from './ConferenceControlButton';
import ConferenceSheetHeader from './ConferenceSheetHeader';
import ConferenceUserRow from './ConferenceUserRow';
import { useOpenConferenceChat } from './useOpenConferenceChat';

type TMember = TConferenceInfoResult['users'][number];

type TMemberSection = 'in-call' | 'waiting' | 'not-in-call';

type TRow =
	| { kind: 'header'; key: string; title: string; count: number }
	| { kind: 'member'; key: string; member: TMember; section: TMemberSection };

interface IPeopleSheetContent {
	onAddPeople: () => void;
}

const RING_LAPSE_MARGIN_MS = 50;
const NO_USERS: TMember[] = [];

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	notice: {
		marginHorizontal: 24,
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 4,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	noticeText: {
		...sharedStyles.textRegular,
		flex: 1,
		fontSize: 14,
		lineHeight: 20
	},
	header: {
		paddingHorizontal: 24,
		paddingVertical: 8,
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	headerText: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	},
	hand: {
		fontSize: 16
	}
});

const buildRows = (users: TMember[], now: number): TRow[] => {
	const { inCall, waiting, notInCall } = groupConferenceMembers(users, now);
	const section = (key: TMemberSection, title: string, members: TMember[]): TRow[] =>
		members.length === 0
			? []
			: [
					{ kind: 'header', key, title, count: members.length },
					...members.map((member): TRow => ({ kind: 'member', key: `${key}-${member._id}`, member, section: key }))
				];
	return [
		...section('waiting', I18n.t('Waiting_to_join'), waiting),
		...section('in-call', I18n.t('In_call'), inCall),
		...section('not-in-call', I18n.t('Not_in_the_call'), notInCall)
	];
};

const PeopleList = ({ onAddPeople }: IPeopleSheetContent): ReactElement => {
	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();
	const callId = useConferenceCallStore(state => state.callId);
	const hands = useConferenceInteractionStore(state => state.hands);
	const selfId = useAppSelector(state => state.login.user.id);
	const participants = useParticipants();
	const { info } = useConferenceInfo(callId, { live: true });
	const [canRing] = usePermissions(['videoconf-ring-users'], info?.rid);
	const openChat = useOpenConferenceChat(info?.chatAccess);
	const [ringingIds, setRingingIds] = useState<string[]>([]);
	const [now, setNow] = useState(() => Date.now());

	const users = info?.users ?? NO_USERS;

	useEffect(() => {
		const lapse = nextRingingLapse(users, now);
		if (lapse === undefined) {
			return;
		}
		const timeout = setTimeout(() => setNow(Date.now()), Math.max(0, lapse - Date.now()) + RING_LAPSE_MARGIN_MS);
		return () => clearTimeout(timeout);
	}, [users, now]);

	const rows = buildRows(users, now);
	const handPositions = new Map(orderRaisedHands(hands).map(({ id }, index) => [id, index + 1]));
	const membersWithoutChat = info?.chatAccess.membersWithoutAccess ?? [];
	const canMute = (userId: string) =>
		userId !== selfId && participants.some(({ identity, isMicrophoneEnabled }) => identity === userId && isMicrophoneEnabled);

	const ringMember = (memberId: string) => {
		if (!callId) {
			return;
		}
		setRingingIds(current => [...current, memberId]);
		videoConferenceRing(callId, memberId)
			.catch(log)
			.finally(() => setRingingIds(current => current.filter(id => id !== memberId)));
	};

	const showChat = () => {
		hideActionSheet();
		openChat();
	};

	const renderRow = ({ item }: { item: TRow }) => {
		if (item.kind === 'header') {
			return (
				<View style={[styles.header, { backgroundColor: colors.surfaceTint }]}>
					<Text style={[styles.headerText, { color: colors.fontDefault }]}>{item.title}</Text>
					<Text style={[styles.headerText, { color: colors.fontDefault }]}>{item.count}</Text>
				</View>
			);
		}
		const { member, section } = item;
		const inCall = section === 'in-call';
		const handPosition = handPositions.get(member._id);
		return (
			<ConferenceUserRow
				userId={member._id}
				name={member.name}
				username={member.username}
				leading={inCall ? <CustomIcon name='status-busy' size={14} color={colors.userPresenceBusy} /> : null}
				testID={`conference-person-${member._id}`}>
				{membersWithoutChat.includes(member._id) ? (
					<View accessible accessibilityLabel={I18n.t('No_chat_access')} testID={`conference-no-chat-${member._id}`}>
						<CustomIcon name='message-disabled' size={16} color={colors.fontHint} />
					</View>
				) : null}
				{handPosition ? <Text style={styles.hand}>{`✋ ${handPosition}`}</Text> : null}
				{!inCall && canRing ? (
					<ConferenceControlButton
						icon='phone-in'
						label={I18n.t('Ring__name__', { name: member.name })}
						size={COMPACT_BUTTON_SIZE}
						disabled={section === 'waiting' || ringingIds.includes(member._id)}
						onPress={() => ringMember(member._id)}
						testID={`conference-ring-${member._id}`}
					/>
				) : null}
				{inCall && canMute(member._id) ? (
					<ConferenceControlButton
						icon='mic-off'
						label={I18n.t('Mute_user', { name: member.name })}
						size={COMPACT_BUTTON_SIZE}
						onPress={() => conferenceSession.requestMute(member._id)}
						testID={`conference-mute-${member._id}`}
					/>
				) : null}
			</ConferenceUserRow>
		);
	};

	return (
		<View style={styles.container} testID='conference-people-sheet'>
			<ConferenceSheetHeader
				title={I18n.t('People')}
				onClose={hideActionSheet}
				actions={
					<ConferenceControlButton
						icon='user-add'
						label={I18n.t('Add_people')}
						size={COMPACT_BUTTON_SIZE}
						onPress={onAddPeople}
						testID='conference-add-people'
					/>
				}
			/>
			{membersWithoutChat.length > 0 ? (
				<Touch
					onPress={showChat}
					accessibilityRole='button'
					style={[styles.notice, { backgroundColor: colors.statusBackgroundWarning }]}
					testID='conference-chat-access-notice'>
					<CustomIcon name='message-disabled' size={20} color={colors.statusFontWarning} />
					<Text style={[styles.noticeText, { color: colors.statusFontWarning }]}>
						{I18n.t('Chat_access_notice', { count: membersWithoutChat.length })}
					</Text>
				</Touch>
			) : null}
			<FlatList data={rows} keyExtractor={row => row.key} renderItem={renderRow} />
		</View>
	);
};

const PeopleSheetContent = ({ onAddPeople }: IPeopleSheetContent): ReactElement | null => {
	const room = useConferenceRoomStore(state => state.room);

	if (!room) {
		return null;
	}

	return (
		<RoomContext.Provider value={room}>
			<PeopleList onAddPeople={onAddPeople} />
		</RoomContext.Provider>
	);
};

export default PeopleSheetContent;
