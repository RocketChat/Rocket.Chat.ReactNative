import { isTrackReference, VideoTrack } from '@livekit/react-native';
import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { isIOS } from '~/lib/methods/helpers';
import { type TPipSource } from '~/lib/methods/helpers/pickPipSource';
import { iosPictureInPictureSourceRef } from '~/lib/services/conference/conferencePictureInPicture';
import { type TTrackRef } from './useConferenceTiles';

interface IConferencePipSource {
	source?: TPipSource<TTrackRef>;
}

const SOURCE_WIDTH = 16;
const SOURCE_HEIGHT = 9;

const styles = StyleSheet.create({
	source: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: SOURCE_WIDTH,
		height: SOURCE_HEIGHT
	}
});

const ConferencePipSource = ({ source }: IConferencePipSource): ReactElement | null => {
	if (!isIOS || !source || source.kind === 'avatar' || !isTrackReference(source.track)) {
		return null;
	}

	return (
		<View pointerEvents='none' style={styles.source} testID='conference-pip-source'>
			<VideoTrack
				ref={iosPictureInPictureSourceRef}
				trackRef={source.track}
				objectFit={source.kind === 'screen' ? 'contain' : 'cover'}
				iosPIP={{
					enabled: true,
					startAutomatically: true,
					stopAutomatically: true,
					preferredSize: { width: SOURCE_WIDTH, height: SOURCE_HEIGHT }
				}}
			/>
		</View>
	);
};

export default ConferencePipSource;
