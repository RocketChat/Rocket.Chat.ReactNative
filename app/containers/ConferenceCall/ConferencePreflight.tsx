import { type ReactElement, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import Button from '~/containers/Button';
import { FormTextInput } from '~/containers/TextInput';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import { useSubscription } from '~/lib/hooks/useSubscription';
import { ensureCameraPermission } from '~/lib/methods/ensureCameraPermission';
import { isIOS } from '~/lib/methods/helpers';
import { isInVideoConference } from '~/lib/methods/helpers/isInVideoConference';
import log from '~/lib/methods/helpers/log';
import { showToast } from '~/lib/methods/helpers/showToast';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { isPreflightCallId, useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { videoConferenceDecline } from '~/lib/services/restApi';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ConferenceEndedMessage from './ConferenceEndedMessage';
import PreflightPeople from './PreflightPeople';
import PreflightPreview from './PreflightPreview';

const styles = StyleSheet.create({
	screen: {
		flex: 1
	},
	content: {
		padding: 24,
		gap: 24
	},
	heading: {
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter,
		fontSize: 24,
		lineHeight: 32
	}
});

const ConferencePreflight = (): ReactElement => {
	const { colors } = useTheme();
	const callId = useConferenceCallStore(state => state.callId);
	const rid = useConferenceCallStore(state => state.rid);
	const isNew = !!callId && isPreflightCallId(callId);
	const subscription = useSubscription(rid);
	const { info, loading } = useConferenceInfo(callId);
	const userId = useAppSelector(state => state.login.user.id);

	const roomName = subscription?.fname || subscription?.name || '';
	const [editedTitle, setEditedTitle] = useState<string>();
	const [mic, setMic] = useState(true);
	const [cam, setCam] = useState(false);
	const wasRung = !isNew && !!info?.users.some(user => user._id === userId && !!user.ringingAt && !user.declined);
	const title = editedTitle ?? (roomName ? I18n.t('Meeting_in_room', { roomName }) : '');

	if (!isNew && info?.endedAt) {
		return <ConferenceEndedMessage />;
	}

	const toggleCamera = async () => {
		if (cam) {
			setCam(false);
			return;
		}
		if (await ensureCameraPermission()) {
			setCam(true);
			return;
		}
		showToast(I18n.t('Camera_access_needed'));
	};

	const cancel = () => {
		if (callId && wasRung) {
			videoConferenceDecline(callId).catch(log);
		}
		closeConferenceCall();
	};

	const join = () => conferenceSession.join({ title: isNew ? title.trim() || undefined : undefined, ring: true, mic, cam });

	return (
		<KeyboardAvoidingView style={styles.screen} behavior={isIOS ? 'padding' : undefined}>
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled' testID='conference-preflight'>
				<PreflightPreview mic={mic} cam={cam} onToggleMic={() => setMic(value => !value)} onToggleCamera={toggleCamera} />

				<Text style={[styles.heading, { color: colors.fontTitlesLabels }]}>
					{isNew ? I18n.t('Start_a_new_conference') : I18n.t('Join_the_conference')}
				</Text>

				{isNew ? (
					<FormTextInput
						label={I18n.t('Call_name')}
						value={title}
						onChangeText={setEditedTitle}
						testID='conference-preflight-title'
					/>
				) : (
					<PreflightPeople people={(info?.users ?? []).filter(isInVideoConference)} />
				)}

				<View>
					<Button
						title={isNew ? I18n.t('Start_call') : I18n.t('Join_call')}
						onPress={join}
						loading={!isNew && loading}
						testID='conference-preflight-join'
					/>
					<Button title={I18n.t('Cancel')} type='secondary' onPress={cancel} testID='conference-preflight-cancel' />
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default ConferencePreflight;
