import { getSpeakerOutputs } from '../getSpeakerOutputs';

describe('getSpeakerOutputs', () => {
	it('uses the loudspeaker and the earpiece on a phone with nothing plugged in', () => {
		expect(getSpeakerOutputs(['speaker', 'earpiece'])).toEqual({ on: 'speaker', off: 'earpiece' });
	});

	it('turns the speaker off onto a Bluetooth headset when one is connected', () => {
		expect(getSpeakerOutputs(['speaker', 'earpiece', 'bluetooth'])).toEqual({ on: 'speaker', off: 'bluetooth' });
	});

	it('prefers a wired headset over the earpiece', () => {
		expect(getSpeakerOutputs(['speaker', 'earpiece', 'headset'])).toEqual({ on: 'speaker', off: 'headset' });
	});

	it('maps the two iOS outputs to forcing the speaker and the system default', () => {
		expect(getSpeakerOutputs(['default', 'force_speaker'])).toEqual({ on: 'force_speaker', off: 'default' });
	});

	it('finds nothing to switch to when there are no outputs', () => {
		expect(getSpeakerOutputs([])).toEqual({ on: undefined, off: undefined });
	});
});
