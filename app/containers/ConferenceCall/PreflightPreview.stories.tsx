import { StyleSheet, View } from 'react-native';

import PreflightPeople from './PreflightPeople';
import PreflightPreview from './PreflightPreview';
import { AllThemes } from './stories/ThemedStory';

const styles = StyleSheet.create({
	frame: {
		padding: 24
	}
});

const noop = () => {};

export default {
	title: 'ConferenceCall/Preflight'
};

export const CameraOff = () => (
	<View style={styles.frame}>
		<PreflightPreview mic cam={false} onToggleMic={noop} onToggleCamera={noop} />
	</View>
);

export const MicMuted = () => (
	<View style={styles.frame}>
		<PreflightPreview mic={false} cam={false} onToggleMic={noop} onToggleCamera={noop} />
	</View>
);

export const PeopleInTheCall = () => (
	<View style={styles.frame}>
		<PreflightPeople
			people={[
				{ _id: 'ada', username: 'ada' },
				{ _id: 'bob', username: 'bob' }
			]}
		/>
	</View>
);

export const Themes = () => (
	<AllThemes>
		{() => (
			<View style={styles.frame}>
				<PreflightPreview mic={false} cam={false} onToggleMic={noop} onToggleCamera={noop} />
			</View>
		)}
	</AllThemes>
);
