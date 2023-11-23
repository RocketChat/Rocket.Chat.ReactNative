import { View, Text } from 'react-native';
import React, { ReactElement, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { getInfoAsync } from 'expo-file-system';
import { useKeepAwake } from 'expo-keep-awake';
import { shallowEqual } from 'react-redux';

import { useTheme } from '../../../../theme';
import { BaseButton } from '../Buttons';
import { CustomIcon } from '../../../CustomIcon';
import sharedStyles from '../../../../views/Styles';
import { ReviewButton } from './ReviewButton';
import { useMessageComposerApi } from '../../context';
import { sendFileMessage } from '../../../../lib/methods';
import { IUpload } from '../../../../definitions';
import log from '../../../../lib/methods/helpers/log';
import { useRoomContext } from '../../../../views/RoomView/context';
import { useAppSelector } from '../../../../lib/hooks';
import { useCanUploadFile } from '../../hooks';
import { Duration, IDurationRef } from './Duration';
import { RECORDING_EXTENSION, RECORDING_MODE, RECORDING_SETTINGS } from './constants';
import AudioPlayer from '../../../AudioPlayer';
import { CancelButton } from './CancelButton';

export const RecordAudio = (): ReactElement => {
	const { colors } = useTheme();
	const recordingRef = useRef<Audio.Recording>();
	const durationRef = useRef<IDurationRef>({} as IDurationRef);
	const [status, setStatus] = React.useState<'recording' | 'reviewing'>('recording');
	const { setRecordingAudio } = useMessageComposerApi();
	const { rid, tmid } = useRoomContext();
	const server = useAppSelector(state => state.server.server);
	const user = useAppSelector(state => ({ id: state.login.user.id, token: state.login.user.token }), shallowEqual);
	const permissionToUpload = useCanUploadFile(rid);
	useKeepAwake();

	useEffect(() => {
		const record = async () => {
			try {
				await Audio.setAudioModeAsync(RECORDING_MODE);
				recordingRef.current = new Audio.Recording();
				await recordingRef.current.prepareToRecordAsync(RECORDING_SETTINGS);
				recordingRef.current.setOnRecordingStatusUpdate(durationRef.current.onRecordingStatusUpdate);
				await recordingRef.current.startAsync();
			} catch (error) {
				console.error(error);
			}
		};
		record();

		return () => {
			recordingRef.current?.stopAndUnloadAsync();
		};
	}, []);

	const cancelRecording = async () => {
		try {
			await recordingRef.current?.stopAndUnloadAsync();
		} catch (error) {
			// Do nothing
		} finally {
			setRecordingAudio(false);
		}
	};

	const goReview = async () => {
		try {
			await recordingRef.current?.stopAndUnloadAsync();
			setStatus('reviewing');
		} catch (error) {
			// Do nothing
		}
	};

	const sendAudio = async () => {
		try {
			setRecordingAudio(false);
			const fileURI = recordingRef.current?.getURI();
			const fileData = await getInfoAsync(fileURI as string);
			const fileInfo = {
				name: `${Date.now()}${RECORDING_EXTENSION}`,
				mime: 'audio/aac',
				type: 'audio/aac',
				store: 'Uploads',
				path: fileURI,
				size: fileData.exists ? fileData.size : null
			} as IUpload;

			if (fileInfo) {
				if (permissionToUpload) {
					await sendFileMessage(rid, fileInfo, tmid, server, user);
				}
			}
		} catch (e) {
			log(e);
		}
	};

	if (status === 'reviewing') {
		return (
			<View
				style={{
					borderTopWidth: 1,
					paddingHorizontal: 16,
					paddingBottom: 12,
					backgroundColor: colors.surfaceLight,
					borderTopColor: colors.strokeLight
				}}
			>
				<View style={{ flexDirection: 'row', paddingVertical: 8 }}>
					<AudioPlayer fileUri={recordingRef.current?.getURI() ?? ''} rid={rid} downloadState='downloaded' />
				</View>
				<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
					<CancelButton onPress={() => cancelRecording()} />
					<View style={{ flex: 1 }} />
					<BaseButton
						onPress={() => sendAudio()}
						testID='message-composer-send'
						accessibilityLabel='Send_message'
						icon='send-filled'
						color={colors.buttonBackgroundPrimaryDefault}
					/>
				</View>
			</View>
		);
	}

	return (
		<View
			style={{
				borderTopWidth: 1,
				paddingHorizontal: 16,
				paddingBottom: 8,
				backgroundColor: colors.surfaceLight,
				borderTopColor: colors.strokeLight
			}}
		>
			<View style={{ flexDirection: 'row', paddingVertical: 24, justifyContent: 'center', alignItems: 'center' }}>
				<CustomIcon name='microphone' size={24} color={colors.fontDanger} />
				<Duration ref={durationRef} />
			</View>
			<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
				<CancelButton onPress={() => cancelRecording()} />
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<Text style={{ fontSize: 14, ...sharedStyles.textRegular, color: colors.fontSecondaryInfo }}>
						Recording audio message
					</Text>
				</View>
				<ReviewButton onPress={goReview} />
			</View>
		</View>
	);
};
