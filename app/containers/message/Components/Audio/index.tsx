import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import moment from 'moment';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
// import Slider from '@react-native-community/slider';
import TrackPlayer, { Event, useTrackPlayerEvents, State, useProgress } from 'react-native-track-player';

import Touchable from '../../Touchable';
import Markdown from '../../../markdown';
import { CustomIcon } from '../../../CustomIcon';
import sharedStyles from '../../../../views/Styles';
import { themes } from '../../../../lib/constants';
import {
	isAndroid
	//  isIOS
} from '../../../../lib/methods/helpers';
import MessageContext from '../../Context';
import ActivityIndicator from '../../../ActivityIndicator';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import { IAttachment } from '../../../../definitions';
import { TSupportedThemes } from '../../../../theme';
import { setupService } from './services';
import Slider from './Slider';

interface IButton {
	loading: boolean;
	paused: boolean;
	theme: TSupportedThemes;
	disabled?: boolean;
	onPress: () => void;
}

interface IMessageAudioProps {
	file: IAttachment;
	isReply?: boolean;
	style?: StyleProp<TextStyle>[];
	theme: TSupportedThemes;
	getCustomEmoji: TGetCustomEmoji;
	scale?: number;
}

const styles = StyleSheet.create({
	audioContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		height: 56,
		borderWidth: 1,
		borderRadius: 4,
		marginBottom: 6
	},
	playPauseButton: {
		marginHorizontal: 10,
		alignItems: 'center',
		backgroundColor: 'transparent'
	},
	audioLoading: {
		marginHorizontal: 8
	},
	duration: {
		marginHorizontal: 12,
		fontSize: 14,
		...sharedStyles.textRegular
	},
	slider: {
		flex: 1
	}
});

const formatTime = (seconds: number) => moment.utc(seconds * 1000).format('mm:ss');

const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

const Button = React.memo(({ loading, paused, onPress, disabled, theme }: IButton) => (
	<Touchable
		style={styles.playPauseButton}
		disabled={disabled}
		onPress={onPress}
		hitSlop={BUTTON_HIT_SLOP}
		background={Touchable.SelectableBackgroundBorderless()}>
		{loading ? (
			<ActivityIndicator style={[styles.playPauseButton, styles.audioLoading]} />
		) : (
			<CustomIcon
				name={paused ? 'play-filled' : 'pause-filled'}
				size={36}
				color={disabled ? themes[theme].tintDisabled : themes[theme].tintColor}
			/>
		)}
	</Touchable>
));

Button.displayName = 'MessageAudioButton';

const MessageAudio = ({
	file,
	isReply,
	style,
	theme,
	getCustomEmoji
}: // scale
IMessageAudioProps) => {
	const [loading, setLoading] = useState(false);
	const [paused, setPaused] = useState(true);
	const [currentTime, setCurrentTime] = useState(0);

	const { baseUrl, user } = useContext(MessageContext);

	const { position, duration } = useProgress();

	useEffect(() => {
		setCurrentTime(position);
	}, [position]);

	useEffect(() => {
		const setup = async () => {
			setupService();
			let url = file.audio_url;
			if (url && !url.startsWith('http')) {
				url = `${baseUrl}${file.audio_url}`;
			}

			setLoading(true);
			try {
				await TrackPlayer.add([
					{
						url: `${url}?rc_uid=${user.id}&rc_token=${user.token}`,
						title: file.title,
						artist: file.author_name,
						duration
					}
				]);
			} catch {
				// Do nothing
			}
		};
		setup();
		return () => {
			TrackPlayer.stop();
		};
	}, []);

	useEffect(() => {
		playPause();
	}, [paused]);

	useEffect(() => {
		if (paused) {
			deactivateKeepAwake();
		} else {
			activateKeepAwake();
		}
	}, [paused, currentTime, duration, file, loading, theme]);

	useTrackPlayerEvents([Event.PlaybackState], ({ state }) => {
		if (state === State.Stopped) {
			try {
				TrackPlayer.stop();
				setPaused(true);
			} catch {
				// do nothing
			}
		}
		if (state === State.Ready) setLoading(false);
	});

	const getDuration = () => formatTime(currentTime || duration);

	const togglePlayPause = () => {
		setPaused(!paused);
	};

	const playPause = () => {
		try {
			if (paused) {
				TrackPlayer.pause();
			} else {
				TrackPlayer.play();
			}
		} catch {
			// Do nothing
		}
	};

	const onValueChange = async (value: number) => {
		try {
			setCurrentTime(value);
			await TrackPlayer.seekTo(value);
		} catch {
			// Do nothing
		}
	};

	const { description } = file;

	if (!baseUrl) {
		return null;
	}

	let thumbColor;
	if (isAndroid && isReply) {
		thumbColor = themes[theme].tintDisabled;
	} else if (isAndroid) {
		thumbColor = themes[theme].tintColor;
	}

	return (
		<>
			<Markdown
				msg={description}
				style={[isReply && style]}
				baseUrl={baseUrl}
				username={user.username}
				getCustomEmoji={getCustomEmoji}
				theme={theme}
			/>
			<View
				style={[
					styles.audioContainer,
					{ backgroundColor: themes[theme].chatComponentBackground, borderColor: themes[theme].borderColor }
				]}>
				<Button disabled={isReply} loading={loading} paused={paused} onPress={togglePlayPause} theme={theme} />
				<Slider
					value={currentTime}
					maximumValue={duration}
					onValueChange={onValueChange}
					thumbTintColor={thumbColor}
					minimumTrackTintColor={themes[theme].tintColor}
					disabled={isReply}
					maximumTrackTintColor={themes[theme].auxiliaryText}
					// thumbImage={isIOS ? { uri: 'audio_thumb', scale } : undefined}
				/>
				{/* <Slider
					disabled={isReply}
					style={styles.slider}
					value={position}
					maximumValue={duration}
					minimumValue={0}
					thumbTintColor={thumbColor}
					minimumTrackTintColor={themes[theme].tintColor}
					maximumTrackTintColor={themes[theme].auxiliaryText}
					onValueChange={onValueChange}
					thumbImage={isIOS ? { uri: 'audio_thumb', scale } : undefined}
				/> */}
				<Text style={[styles.duration, { color: themes[theme].auxiliaryText }]}>{getDuration()}</Text>
			</View>
		</>
	);
};

export default MessageAudio;
