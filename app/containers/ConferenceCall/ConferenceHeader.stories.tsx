import ConferenceHeader from './ConferenceHeader';
import RaisedHandPill from './RaisedHandPill';
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
		speakerOn
		onSpeakerPress={noop}
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
		speakerOn
		onSpeakerPress={noop}
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
		speakerOn={false}
		onSpeakerPress={noop}
		onPeoplePress={noop}
		chatUnread={12}
		chatDisabled={false}
		onChatPress={noop}
	/>
);

export const WithRaisedHand = () => (
	<ConferenceHeader
		elapsedSeconds={74}
		title='Meeting in "general-team-room"'
		peopleCount={3}
		speakerOn
		onSpeakerPress={noop}
		onPeoplePress={noop}
		chatUnread={0}
		chatDisabled={false}
		onChatPress={noop}
		pills={<RaisedHandPill label='You +1' accessibilityLabel='Raised hands' onPress={noop} />}
	/>
);

export const Themes = () => (
	<AllThemes>
		{() => (
			<ConferenceHeader
				elapsedSeconds={74}
				title='Meeting in "general"'
				peopleCount={3}
				speakerOn
				onSpeakerPress={noop}
				onPeoplePress={noop}
				chatUnread={0}
				chatDisabled={false}
				onChatPress={noop}
				pills={<RaisedHandPill label='You' accessibilityLabel='Raised hands' onPress={noop} />}
			/>
		)}
	</AllThemes>
);
