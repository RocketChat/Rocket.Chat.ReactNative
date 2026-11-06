import ConferenceControls from './ConferenceControls';
import { AllThemes } from './stories/ThemedStory';

const noop = () => {};

interface IControlsStory {
	micEnabled?: boolean;
	cameraEnabled?: boolean;
	handRaised?: boolean;
}

const Controls = ({ micEnabled = true, cameraEnabled = true, handRaised = false }: IControlsStory) => (
	<ConferenceControls
		micEnabled={micEnabled}
		cameraEnabled={cameraEnabled}
		handRaised={handRaised}
		onToggleMic={noop}
		onToggleCamera={noop}
		onMicOptions={noop}
		onCameraOptions={noop}
		onToggleHand={noop}
		onReaction={noop}
		onMore={noop}
		onLeave={noop}
	/>
);

export default {
	title: 'ConferenceCall/ConferenceControls'
};

export const MicAndCameraOn = () => <Controls />;

export const MicAndCameraOff = () => <Controls micEnabled={false} cameraEnabled={false} />;

export const HandRaised = () => <Controls cameraEnabled={false} handRaised />;

export const Themes = () => <AllThemes>{() => <Controls micEnabled={false} cameraEnabled={false} handRaised />}</AllThemes>;
