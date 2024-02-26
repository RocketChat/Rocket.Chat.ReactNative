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
import { RECORDING_EXTENSION, RECORDING_MODE, RECORDING_SETTINGS } from '../../../../lib/constants';
import { useAppSelector } from '../../../../lib/hooks';
import log from '../../../../lib/methods/helpers/log';
import { IUpload } from '../../../../definitions';
import { useRoomContext } from '../../../../views/RoomView/context';
import { useCanUploadFile } from '../../hooks';
import { Duration, IDurationRef } from './Duration';
import AudioPlayer from '../../../AudioPlayer';
import { CancelButton } from './CancelButton';
import i18n from '../../../../i18n';

export const RecordAudio = (): ReactElement | null => {
	const [styles, colors] = useStyle();
	const recordingRef = useRef<Audio.Recording>();
	const durationRef = useRef<IDurationRef>({} as IDurationRef);
	const numberOfTriesRef = useRef(0);
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
			} catch (error: any) {
				// error only occurs on iOS devices
				if (error?.code === 'E_AUDIO_RECORDERNOTCREATED') {
					if (numberOfTriesRef.current <= 5) {
						recordingRef.current = undefined;
						numberOfTriesRef.current += 1;
						setTimeout(() => {
							record();
						}, 100);
					} else {
						console.error(error);
					}
				} else {
					console.error(error);
				}
			}
		};
		record();

		return () => {
			try {
				recordingRef.current?.stopAndUnloadAsync();
			} catch {
				// Do nothing
			}
		};
	}, []);

	const cancelRecording = async () => {
		try {
			await recordingRef.current?.stopAndUnloadAsync();
		} catch {
			// Do nothing
		} finally {
			setRecordingAudio(false);
		}
	};

	const goReview = async () => {
		try {
			await recordingRef.current?.stopAndUnloadAsync();
			setStatus('reviewing');
		} catch {
			// Do nothing
		}
	};

	const sendAudio = async () => {
		try {
			if (!rid) return;
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

	if (!rid) {
		return null;
	}

	if (status === 'reviewing') {
		return (
			<View style={styles.review}>
				<View style={styles.audioPlayer}>
					<AudioPlayer fileUri={recordingRef.current?.getURI() ?? ''} rid={rid} downloadState='downloaded' />
				</View>
				<View style={styles.buttons}>
					<CancelButton onPress={cancelRecording} />
					<View style={{ flex: 1 }} />
					<BaseButton
						onPress={sendAudio}
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
		<View style={styles.recording}>
			<View style={styles.duration}>
				<CustomIcon name='microphone' size={24} color={colors.fontDanger} />
				<Duration ref={durationRef} />
			</View>
			<View style={styles.buttons}>
				<CancelButton onPress={cancelRecording} />
				<View style={styles.recordingNote}>
					<Text style={styles.recordingNoteText}>{i18n.t('Recording_audio_in_progress')}</Text>
				</View>
				<ReviewButton onPress={goReview} />
			</View>
		</View>
	);
};

function useStyle() {
	const { colors } = useTheme();
	const style = {
		review: {
			borderTopWidth: 1,
			paddingHorizontal: 16,
			paddingBottom: 12,
			backgroundColor: colors.surfaceLight,
			borderTopColor: colors.strokeLight
		},
		recording: {
			borderTopWidth: 1,
			paddingHorizontal: 16,
			paddingBottom: 8,
			backgroundColor: colors.surfaceLight,
			borderTopColor: colors.strokeLight
		},
		duration: {
			flexDirection: 'row',
			paddingVertical: 24,
			justifyContent: 'center',
			alignItems: 'center'
		},
		audioPlayer: {
			flexDirection: 'row',
			paddingVertical: 8
		},
		buttons: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center'
		},
		recordingNote: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		recordingNoteText: {
			fontSize: 14,
			...sharedStyles.textRegular,
			color: colors.fontSecondaryInfo
		}
	} as const;
	return [style, colors] as const;
}
