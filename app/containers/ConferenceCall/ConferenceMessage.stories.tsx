import { StyleSheet, View } from 'react-native';

import ConferenceMessage from './ConferenceMessage';
import { AllThemes } from './stories/ThemedStory';

const styles = StyleSheet.create({
	frame: {
		height: 360
	}
});

const noop = () => {};

export default {
	title: 'ConferenceCall/ConferenceMessage'
};

export const Connecting = () => (
	<View style={styles.frame}>
		<ConferenceMessage
			loading
			title='Connecting...'
			actions={[{ title: 'Cancel', type: 'secondary', onPress: noop, testID: 'cancel' }]}
		/>
	</View>
);

export const Ended = () => (
	<View style={styles.frame}>
		<ConferenceMessage icon='phone-off' title='Call ended' actions={[{ title: 'Close', onPress: noop, testID: 'close' }]} />
	</View>
);

export const NotLicensed = () => (
	<View style={styles.frame}>
		<ConferenceMessage
			icon='warning'
			title="This Workspace's license doesn't include LiveKit calls."
			actions={[
				{ title: 'Try again', onPress: noop, testID: 'retry' },
				{ title: 'Close', type: 'secondary', onPress: noop, testID: 'close' }
			]}
		/>
	</View>
);

export const Themes = () => (
	<AllThemes>
		{() => (
			<View style={styles.frame}>
				<ConferenceMessage icon='phone-off' title='Call ended' actions={[{ title: 'Close', onPress: noop, testID: 'close' }]} />
			</View>
		)}
	</AllThemes>
);
