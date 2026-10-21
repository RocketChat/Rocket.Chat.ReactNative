import { StyleSheet, View } from 'react-native';

import ParticipantTileView from './ParticipantTileView';
import { AllThemes } from './stories/ThemedStory';

const styles = StyleSheet.create({
	tile: {
		width: 185,
		height: 237,
		margin: 8
	},
	row: {
		flexDirection: 'row'
	}
});

const video = <View style={[StyleSheet.absoluteFill, { backgroundColor: '#3a6ea5' }]} />;

export default {
	title: 'ConferenceCall/ParticipantTileView'
};

export const WithoutCamera = () => (
	<View style={styles.tile}>
		<ParticipantTileView identity='ada' name='Ada Lovelace' muted={false} />
	</View>
);

export const WithCamera = () => (
	<View style={styles.tile}>
		<ParticipantTileView identity='ada' name='Ada Lovelace' muted={false} video={video} />
	</View>
);

export const Muted = () => (
	<View style={styles.tile}>
		<ParticipantTileView identity='ada' name='Ada Lovelace' muted />
	</View>
);

export const Speaking = () => (
	<View style={styles.tile}>
		<ParticipantTileView identity='ada' name='Ada Lovelace' muted={false} speaking />
	</View>
);

export const HandRaised = () => (
	<View style={styles.tile}>
		<ParticipantTileView identity='ada' name='Ada Lovelace' muted={false} handPosition={1} />
	</View>
);

export const SendResolutionBadge = () => (
	<View style={styles.tile}>
		<ParticipantTileView identity='ada' name='Ada Lovelace' muted={false} video={video} badge='720p' />
	</View>
);

export const Themes = () => (
	<AllThemes>
		{() => (
			<View style={styles.row}>
				<View style={styles.tile}>
					<ParticipantTileView identity='ada' name='Ada Lovelace' muted handPosition={2} />
				</View>
				<View style={styles.tile}>
					<ParticipantTileView identity='bob' name='Bob' muted={false} video={video} speaking />
				</View>
			</View>
		)}
	</AllThemes>
);
