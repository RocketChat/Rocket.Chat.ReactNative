import { isTrackReference, VideoTrack } from '@livekit/react-native';
import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { type TPipSource } from '~/lib/methods/helpers/pickPipSource';
import { useTheme } from '~/theme';
import ParticipantTileView from './ParticipantTileView';
import { type TTrackRef } from './useConferenceTiles';

interface IConferencePipView {
	source?: TPipSource<TTrackRef>;
}

const styles = StyleSheet.create({
	fill: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	}
});

const ConferencePipView = ({ source }: IConferencePipView): ReactElement => {
	const { colors } = useTheme();

	if (source?.kind === 'screen' && isTrackReference(source.track)) {
		return (
			<View style={[styles.fill, { backgroundColor: colors.backdropColor }]} testID='conference-pip'>
				<VideoTrack trackRef={source.track} style={StyleSheet.absoluteFill} objectFit='contain' />
			</View>
		);
	}

	if (source) {
		return (
			<View style={styles.fill} testID='conference-pip'>
				<ParticipantTileView
					identity={source.id}
					name={source.name}
					muted={false}
					video={
						source.kind === 'camera' && isTrackReference(source.track) ? (
							<VideoTrack trackRef={source.track} style={StyleSheet.absoluteFill} objectFit='cover' />
						) : null
					}
				/>
			</View>
		);
	}

	return <View style={[styles.fill, { backgroundColor: colors.backdropColor }]} testID='conference-pip' />;
};

export default ConferencePipView;
