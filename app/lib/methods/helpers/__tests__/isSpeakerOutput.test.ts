import { isSpeakerOutput } from '../isSpeakerOutput';

describe('isSpeakerOutput', () => {
	it.each(['speaker', 'force_speaker'])('calls %s the loudspeaker', output => {
		expect(isSpeakerOutput(output)).toBe(true);
	});

	it.each(['earpiece', 'headset', 'bluetooth', 'default'])('does not call %s the loudspeaker', output => {
		expect(isSpeakerOutput(output)).toBe(false);
	});
});
