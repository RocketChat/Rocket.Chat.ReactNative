import type { ReactElement } from 'react';

import { colors } from '~/lib/constants/colors';
import { buildAudioOutputOptions, buildVideoQualityOptions } from '../buildConferenceMenuOptions';

describe('buildAudioOutputOptions', () => {
	it('offers each output the platform reported, named for people', () => {
		const options = buildAudioOutputOptions(['speaker', 'earpiece', 'headset', 'bluetooth'], jest.fn());

		expect(options.map(({ title }) => title)).toEqual(['Speaker', 'Earpiece', 'Headset', 'Bluetooth']);
	});

	it('names the two outputs iOS can force', () => {
		const options = buildAudioOutputOptions(['default', 'force_speaker'], jest.fn());

		expect(options.map(({ title }) => title)).toEqual(['Default', 'Speaker']);
	});

	it('selects the output that was tapped', () => {
		const onSelect = jest.fn();
		const [, earpiece] = buildAudioOutputOptions(['speaker', 'earpiece'], onSelect);

		earpiece.onPress();

		expect(onSelect).toHaveBeenCalledWith('earpiece');
	});

	it('does not break on an output it has never heard of', () => {
		const [option] = buildAudioOutputOptions(['carplay'], jest.fn());

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
