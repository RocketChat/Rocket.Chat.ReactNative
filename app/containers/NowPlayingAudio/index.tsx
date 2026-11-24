import { Pressable, Text, View } from 'react-native';

import i18n from '~/i18n';
import { useTheme } from '~/theme';
import { CustomIcon } from '~/containers/CustomIcon';
import NativeButton from '~/containers/NativeButton';
import { formatTime } from '~/containers/AudioPlayer/formatTime';
import { type INowPlayingAudio } from '~/lib/methods/useNowPlayingAudioStore';
import { useNowPlayingAudio, useNowPlayingAudioActions } from './useNowPlayingAudio';
import styles from './styles';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

const NowPlayingAudioBar = ({ audio }: { audio: INowPlayingAudio }) => {
	const { colors } = useTheme();
	const { title, roomName, togglePlayPause, close, openSourceRoom } = useNowPlayingAudioActions(audio);
	const progress = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
	const subtitle = roomName ? `${roomName} · ${progress}` : progress;

	return (
		<View
			testID='now-playing-audio'
			style={[styles.container, { backgroundColor: colors.surfaceLight, borderBottomColor: colors.strokeExtraLight }]}>
			<NativeButton
				testID='now-playing-audio-play-pause'
				accessible
				accessibilityRole='button'
				accessibilityLabel={i18n.t(audio.playing ? 'Pause' : 'Play')}
				style={[styles.playPauseButton, { backgroundColor: colors.buttonBackgroundPrimaryDefault }]}
				onPress={togglePlayPause}
				hitSlop={HIT_SLOP}>
				<CustomIcon
					name={audio.playing ? 'pause-shape-filled' : 'play-shape-filled'}
					size={24}
					color={colors.buttonFontPrimary}
				/>
			</NativeButton>
			<Pressable
				testID='now-playing-audio-open-room'
				accessibilityRole='button'
				accessibilityLabel={`${i18n.t('Audio_message_from', { name: title })}, ${subtitle}`}
				accessibilityHint={i18n.t('Opens_the_room_of_this_audio_message')}
				style={styles.details}
				onPress={openSourceRoom}>
				<Text numberOfLines={1} style={[styles.title, { color: colors.fontTitlesLabels }]}>
					{title}
				</Text>
				<Text numberOfLines={1} style={[styles.subtitle, { color: colors.fontSecondaryInfo }]}>
					{subtitle}
				</Text>
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
	);
};

const NowPlayingAudio = () => {
	const audio = useNowPlayingAudio();
	if (!audio) {
		return null;
	}
	return <NowPlayingAudioBar audio={audio} />;
};

export default NowPlayingAudio;
