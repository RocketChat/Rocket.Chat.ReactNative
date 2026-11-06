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
		audioOutput='speaker'
		onAudioOutputPress={noop}
		chatUnread={0}
		chatDisabled={false}
		onChatPress={noop}
	/>
);

export const WithoutTitle = () => (
	<ConferenceHeader
		elapsedSeconds={3725}
		audioOutput='speaker'
		onAudioOutputPress={noop}
		chatUnread={0}
		chatDisabled={false}
		onChatPress={noop}
	/>
);

export const WithUnreadChat = () => (
	<ConferenceHeader
		elapsedSeconds={74}
		title='Meeting in "general"'
		audioOutput='earpiece'
		onAudioOutputPress={noop}
		chatUnread={12}
		chatDisabled={false}
		onChatPress={noop}
	/>
);

export const WithRaisedHand = () => (
	<ConferenceHeader
		elapsedSeconds={74}
		title='Meeting in "general-team-room"'
		audioOutput='speaker'
		onAudioOutputPress={noop}
		chatUnread={0}
		chatDisabled={false}
		onChatPress={noop}
		handPill={<RaisedHandPill label='You +1' accessibilityLabel='Raised hands' onPress={noop} />}
	/>
);

export const Themes = () => (
	<AllThemes>
		{() => (
			<ConferenceHeader
				elapsedSeconds={74}
				title='Meeting in "general"'
				audioOutput='speaker'
				onAudioOutputPress={noop}
				chatUnread={0}
				chatDisabled={false}
				onChatPress={noop}
				handPill={<RaisedHandPill label='You' accessibilityLabel='Raised hands' onPress={noop} />}
			/>
		)}
	</AllThemes>
);
