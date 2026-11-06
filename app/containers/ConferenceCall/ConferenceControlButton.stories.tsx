import { StyleSheet, View } from 'react-native';

import ConferenceControlButton, { CONTROL_ICON_SIZE } from './ConferenceControlButton';
import HandIcon from './HandIcon';
import { AllThemes } from './stories/ThemedStory';

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		gap: 12,
		padding: 16
	}
});

export default {
	title: 'ConferenceCall/ConferenceControlButton'
};

export const Default = () => <ConferenceControlButton icon='mic' label='Mute' onPress={() => {}} />;

export const Danger = () => <ConferenceControlButton icon='mic-off' label='Unmute' variant='danger' onPress={() => {}} />;

export const Toggled = () => (
	<ConferenceControlButton
		renderIcon={color => <HandIcon color={color} size={CONTROL_ICON_SIZE} />}
		label='Lower hand'
		variant='toggled'
		onPress={() => {}}
	/>
);

export const WithBadge = () => <ConferenceControlButton icon='team' label='People' badge={3} size={36} onPress={() => {}} />;

export const Disabled = () => <ConferenceControlButton icon='video' label='Start camera' disabled onPress={() => {}} />;

export const Themes = () => (
	<AllThemes>
		{() => (
			<View style={styles.row}>
				<ConferenceControlButton icon='mic' label='Mute' onPress={() => {}} />
				<ConferenceControlButton icon='camera-disabled' label='Start camera' variant='danger' onPress={() => {}} />
				<ConferenceControlButton
					renderIcon={color => <HandIcon color={color} size={CONTROL_ICON_SIZE} />}
					label='Lower hand'
					variant='toggled'
					onPress={() => {}}
				/>
				<ConferenceControlButton icon='phone-off' label='Leave call' variant='danger' onPress={() => {}} />
			</View>
		)}
	</AllThemes>
);
