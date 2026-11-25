import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '~/i18n';
import { useTheme } from '~/theme';
import { CustomIcon } from '~/containers/CustomIcon';
import NativeButton from '~/containers/NativeButton';
import AudioControls from '~/containers/AudioPlayer/AudioControls';
import { type INowPlayingAudio } from '~/lib/methods/useNowPlayingAudioStore';
import { hasNativeHeaderBar } from '~/lib/methods/helpers/deviceInfo';
import {
	useIsInCall,
	useIsRoomFocused,
	useNowPlayingAudio,
	useNowPlayingAudioActions,
	useNowPlayingAudioPlayback
} from './useNowPlayingAudio';
import { useNowPlayingAudioDetails } from './useNowPlayingAudioDetails';
import styles from './styles';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

const NowPlayingAudioBar = ({ audio }: { audio: INowPlayingAudio }) => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const { title, roomName } = useNowPlayingAudioDetails(audio.rid, audio.msgId);
	const { close, openSourceRoom } = useNowPlayingAudioActions(audio);
	const { position, duration, waveform, togglePlayPause, seek } = useNowPlayingAudioPlayback(audio);

	return (
		<View
			testID='now-playing-audio'
			style={[
				styles.container,
				{ backgroundColor: colors.surfaceLight, borderBottomColor: colors.strokeExtraLight },
				hasNativeHeaderBar && { paddingTop: insets.top + styles.container.paddingVertical }
			]}>
			<View style={styles.header}>
				<Pressable
					testID='now-playing-audio-open-room'
					accessibilityRole='button'
					accessibilityLabel={i18n.t('Audio_message_from', { name: roomName ? `${title}, ${roomName}` : title })}
					accessibilityHint={i18n.t('Opens_the_room_of_this_audio_message')}
					style={styles.details}
					onPress={openSourceRoom}>
					<Text numberOfLines={1} style={[styles.title, { color: colors.fontTitlesLabels }]}>
						{title}
					</Text>
					{roomName ? (
						<Text numberOfLines={1} style={[styles.roomName, { color: colors.fontSecondaryInfo }]}>
							{roomName}
						</Text>
					) : null}
				</Pressable>
				<NativeButton
					testID='now-playing-audio-close'
					accessible
					accessibilityRole='button'
					accessibilityLabel={i18n.t('Close_audio_player')}
					style={styles.closeButton}
					onPress={close}
					hitSlop={HIT_SLOP}>
					<CustomIcon name='close' size={24} color={colors.fontSecondaryInfo} />
				</NativeButton>
			</View>
			<View style={styles.controls}>
				<AudioControls
					audioState={audio.playing ? 'playing' : 'paused'}
					loaded
					currentTime={position}
					duration={duration}
					peaks={waveform}
					onPlayPress={togglePlayPause}
					onSeek={seek}
					testIDPrefix='now-playing-audio-'
				/>
			</View>
		</View>
	);
};

const NowPlayingAudio = () => {
	const audio = useNowPlayingAudio();
	const isInCall = useIsInCall();
	const isRoomFocused = useIsRoomFocused(audio?.rid ?? '');
	if (!audio || isInCall || isRoomFocused) {
		return null;
	}
	return <NowPlayingAudioBar key={audio.audioKey} audio={audio} />;
};

export default NowPlayingAudio;
