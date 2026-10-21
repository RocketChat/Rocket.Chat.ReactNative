import type { ReactElement } from 'react';

import { colors } from '~/lib/constants/colors';
import { type TCameraDevice } from '~/lib/methods/helpers/pickCameraDevices';
import {
	buildAudioOutputOptions,
	buildCameraOptions,
	buildVideoQualityOptions,
	getAudioOutputIcon,
	isSpeakerOutput
} from '../buildConferenceMenuOptions';

describe('getAudioOutputIcon', () => {
	it('shows an output it has never heard of with the default icon', () => {
		expect(getAudioOutputIcon('carplay')).toBe('volume');
	});
});

describe('buildAudioOutputOptions', () => {
	it('offers each output the platform reported, named for people', () => {
		const options = buildAudioOutputOptions(['speaker', 'earpiece', 'headset', 'bluetooth'], 'speaker', colors.light, jest.fn());

		expect(options.map(({ title }) => title)).toEqual(['Speaker', 'Earpiece', 'Headset', 'Bluetooth']);
	});

	it('names the two outputs iOS can force', () => {
		const options = buildAudioOutputOptions(['default', 'force_speaker'], 'default', colors.light, jest.fn());

		expect(options.map(({ title }) => title)).toEqual(['Default', 'Speaker']);
	});

	it('selects the output that was tapped', () => {
		const onSelect = jest.fn();
		const [, earpiece] = buildAudioOutputOptions(['speaker', 'earpiece'], 'speaker', colors.light, onSelect);

		earpiece.onPress();

		expect(onSelect).toHaveBeenCalledWith('earpiece');
	});

	it('marks only the output in use as selected', () => {
		const options = buildAudioOutputOptions(['speaker', 'earpiece', 'bluetooth'], 'earpiece', colors.light, jest.fn());

		const selected = options.map(option => (option.right?.() as ReactElement<{ name: string }>).props.name);

		expect(selected).toEqual(['radio-unchecked', 'radio-checked', 'radio-unchecked']);
	});

	it('does not break on an output it has never heard of', () => {
		const [option] = buildAudioOutputOptions(['carplay'], 'speaker', colors.light, jest.fn());

		expect(option.title).toBe('Default');
	});
});

describe('buildVideoQualityOptions', () => {
	it('offers every resolution, automatic first', () => {
		const options = buildVideoQualityOptions('auto', colors.light, jest.fn());

		expect(options.map(({ title }) => title)).toEqual(['Auto', '1080p', '720p', '360p', '180p']);
	});

	it('picks the resolution that was tapped', () => {
		const onSelect = jest.fn();
		const options = buildVideoQualityOptions('auto', colors.light, onSelect);

		options[2].onPress();

		expect(onSelect).toHaveBeenCalledWith('h720');
	});

	it('marks only the current resolution as selected', () => {
		const options = buildVideoQualityOptions('h360', colors.light, jest.fn());

		const selected = options.map(option => (option.right?.() as ReactElement<{ name: string }>).props.name);

		expect(selected).toEqual(['radio-unchecked', 'radio-unchecked', 'radio-unchecked', 'radio-checked', 'radio-unchecked']);
	});
});

describe('buildCameraOptions', () => {
	const camera = (rest: Partial<TCameraDevice>): TCameraDevice => ({
		deviceId: '0',
		facing: 'environment',
		ordinal: undefined,
		label: undefined,
		...rest
	});

	it('names a camera by where it faces when the system only gave it a number', () => {
		const options = buildCameraOptions(
			[camera({ deviceId: '1', facing: 'user' }), camera({ deviceId: '0' })],
			undefined,
			colors.light,
			jest.fn()
		);

		expect(options.map(({ title }) => title)).toEqual(['Front camera', 'Back camera']);
	});

	it('numbers the cameras that face the same way', () => {
		const options = buildCameraOptions(
			[camera({ deviceId: '0', ordinal: 1 }), camera({ deviceId: '2', ordinal: 2 })],
			undefined,
			colors.light,
			jest.fn()
		);

		expect(options.map(({ title }) => title)).toEqual(['Back camera 1', 'Back camera 2']);
	});

	it('uses the name the system gave the camera', () => {
		const [option] = buildCameraOptions([camera({ label: 'Back Ultra Wide Camera' })], undefined, colors.light, jest.fn());

		expect(option.title).toBe('Back Ultra Wide Camera');
	});

	it('calls a camera that faces neither way just a camera', () => {
		const [option] = buildCameraOptions([camera({ deviceId: 'usb', facing: undefined })], undefined, colors.light, jest.fn());

		expect(option.title).toBe('Camera');
	});

	it('marks only the selected camera', () => {
		const options = buildCameraOptions([camera({ deviceId: '0' }), camera({ deviceId: '1' })], '1', colors.light, jest.fn());

		const selected = options.map(option => (option.right?.() as ReactElement<{ name: string }>).props.name);

		expect(selected).toEqual(['radio-unchecked', 'radio-checked']);
	});

	it('picks the camera that was tapped', () => {
		const onSelect = jest.fn();
		const second = camera({ deviceId: '1' });
		const options = buildCameraOptions([camera({ deviceId: '0' }), second], undefined, colors.light, onSelect);

		options[1].onPress();

		expect(onSelect).toHaveBeenCalledWith(second);
	});
});

describe('isSpeakerOutput', () => {
	it.each(['speaker', 'force_speaker'])('calls %s the loudspeaker', output => {
		expect(isSpeakerOutput(output)).toBe(true);
	});

	it.each(['earpiece', 'headset', 'bluetooth', 'default'])('does not call %s the loudspeaker', output => {
		expect(isSpeakerOutput(output)).toBe(false);
	});
});
