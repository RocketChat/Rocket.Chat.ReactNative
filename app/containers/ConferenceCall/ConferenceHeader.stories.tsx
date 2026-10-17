import ConferenceHeader from './ConferenceHeader';
import { AllThemes } from './stories/ThemedStory';

const noop = () => {};

export default {
	title: 'ConferenceCall/ConferenceHeader'
};

export const Default = () => (
	<ConferenceHeader
		elapsedSeconds={74}
		title='Meeting in "general"'
		peopleCount={3}
		audioOutput='speaker'
		onAudioOutputPress={noop}
		onPeoplePress={noop}
		chatUnread={0}
		chatDisabled={false}
		onChatPress={noop}
	/>
);

export const WithoutTitle = () => (
	<ConferenceHeader
		elapsedSeconds={3725}
		peopleCount={2}
		audioOutput='speaker'
		onAudioOutputPress={noop}
		onPeoplePress={noop}
		chatUnread={0}
		chatDisabled={false}
		onChatPress={noop}
	/>
);

export const WithUnreadChat = () => (
	<ConferenceHeader
		elapsedSeconds={74}
		title='Meeting in "general"'
		peopleCount={3}
		audioOutput='earpiece'
		onAudioOutputPress={noop}
		onPeoplePress={noop}
		chatUnread={12}
		chatDisabled={false}
		onChatPress={noop}
	/>
);

export const Themes = () => (
	<AllThemes>
		{() => (
			<ConferenceHeader
				elapsedSeconds={74}
				title='Meeting in "general"'
				peopleCount={3}
				audioOutput='speaker'
				onAudioOutputPress={noop}
				onPeoplePress={noop}
				chatUnread={0}
				chatDisabled={false}
				onChatPress={noop}
			/>
		)}
	</AllThemes>
);
