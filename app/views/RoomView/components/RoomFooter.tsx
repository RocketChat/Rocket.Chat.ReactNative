import { type RefObject } from 'react';
import { Text, View } from 'react-native';

import Touch from '../../../containers/Touch';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants/colors';
import { isBlocked } from '../../../lib/methods/helpers/room';
import { type IRoomFederated, isRoomFederated, isRoomNativeFederated } from '../../../lib/methods/isRoomFederated';
import { ComposerAttachments, type IMessageComposerRef, MessageComposerContainer } from '../../../containers/MessageComposer';
import styles from '../styles';
import { useRoomStore, useRoomWithUpdate } from '../stores/RoomStoreContext';

interface IRoomFooterProps {
	rid?: string;
	paddingBottom: number;
	readOnly: boolean;
	airGappedRestrictionRemainingDays: number | undefined;
	isFederationEnabled: boolean;
	isFederationModuleEnabled: boolean;
	messageComposerRef: RefObject<IMessageComposerRef | null>;
}

export const RoomFooter = ({
	rid,
	paddingBottom,
	readOnly,
	airGappedRestrictionRemainingDays,
	isFederationEnabled,
	isFederationModuleEnabled,
	messageComposerRef
}: IRoomFooterProps) => {
	'use memo';

	const { theme } = useTheme();
	const room = useRoomWithUpdate();
	const joined = useRoomStore(s => s.joined);
	const loading = useRoomStore(s => s.loading);
	const joinRoom = useRoomStore(s => s.joinRoom);
	const resumeRoom = useRoomStore(s => s.resumeRoom);

	const footerBottomInset = { paddingBottom };

	const getFederatedFooterDescription = (federatedRoom: IRoomFederated) => {
		if (!isRoomNativeFederated(federatedRoom)) {
			return I18n.t('Federation_Matrix_room_description_invalid_version');
		}
		if (!isFederationEnabled) {
			return I18n.t('Federation_Matrix_room_description_disabled');
		}
		if (!isFederationModuleEnabled) {
			return I18n.t('Federation_Matrix_room_description_missing_module');
		}
		return undefined;
	};

	if (!rid) {
		return null;
	}
	if ('onHold' in room && room.onHold) {
		return (
			<View style={[styles.joinRoomContainer, footerBottomInset]} key='room-view-chat-on-hold' testID='room-view-chat-on-hold'>
				<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('Chat_is_on_hold')}</Text>
				<Touch
					onPress={resumeRoom}
					style={[styles.joinRoomButton, { backgroundColor: themes[theme].fontHint }]}
					enabled={!loading}>
					<Text style={[styles.joinRoomText, { color: themes[theme].fontWhite }]} testID='room-view-chat-on-hold-button'>
						{I18n.t('Resume')}
					</Text>
				</Touch>
			</View>
		);
	}
	if (!joined) {
		return (
			<View style={[styles.joinRoomContainer, footerBottomInset]} key='room-view-join' testID='room-view-join'>
				<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('You_are_in_preview_mode')}</Text>
				<Touch onPress={joinRoom} style={[styles.joinRoomButton, { backgroundColor: themes[theme].fontHint }]} enabled={!loading}>
					<Text style={[styles.joinRoomText, { color: themes[theme].fontWhite }]} testID='room-view-join-button'>
						{I18n.t(room.t === 'l' ? 'Take_it' : 'Join')}
					</Text>
				</Touch>
			</View>
		);
	}
	if (airGappedRestrictionRemainingDays !== undefined && airGappedRestrictionRemainingDays === 0) {
		return (
			<View style={[styles.readOnly, footerBottomInset]}>
				<Text style={[styles.previewMode, { color: themes[theme].fontDefault }]}>
					{I18n.t('AirGapped_workspace_read_only_title')}
				</Text>
				<Text style={[styles.readOnlyDescription, { color: themes[theme].fontDefault }]}>
					{I18n.t('AirGapped_workspace_read_only_description')}
				</Text>
			</View>
		);
	}
	if (readOnly) {
		return (
			<View style={[styles.readOnly, footerBottomInset]}>
				<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_read_only')}</Text>
			</View>
		);
	}
	if ('id' in room && isBlocked(room)) {
		return (
			<View style={[styles.readOnly, footerBottomInset]}>
				<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('This_room_is_blocked')}</Text>
			</View>
		);
	}

	if ('id' in room && isRoomFederated(room)) {
		const description = getFederatedFooterDescription(room);

		if (description) {
			return (
				<View style={[styles.readOnly, footerBottomInset]}>
					<Text style={[styles.previewMode, { color: themes[theme].fontTitlesLabels }]}>{description}</Text>
				</View>
			);
		}
	}

	return (
		<MessageComposerContainer ref={messageComposerRef}>
			<ComposerAttachments />
		</MessageComposerContainer>
	);
};
