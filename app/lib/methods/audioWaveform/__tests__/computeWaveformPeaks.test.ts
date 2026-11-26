import { computeWaveformPeaks, WAVEFORM_BAR_COUNT } from '../computeWaveformPeaks';

describe('computeWaveformPeaks', () => {
	it('takes the loudest sample of each block, scaled to the loudest bar', () => {
		expect(computeWaveformPeaks([0.1, -0.2, 0.4, 0, -0.8, 0.3, 0.2, -0.1], 4)).toEqual([0.25, 0.5, 1, 0.25]);
	});

	it('drops the samples left over after the last full block', () => {
		expect(computeWaveformPeaks([0.5, 0.25, 1], 2)).toEqual([1, 0.5]);
	});

	it('returns 40 bars by default', () => {
		const samples = Array.from({ length: 4000 }, (_, index) => Math.sin(index));
		expect(computeWaveformPeaks(samples)).toHaveLength(WAVEFORM_BAR_COUNT);
	});

	it('returns no bars when there are fewer samples than bars', () => {
		expect(computeWaveformPeaks([0.5, 0.5], 4)).toEqual([]);
	});

	it('keeps silence flat', () => {
		expect(computeWaveformPeaks([0, 0, 0, 0], 2)).toEqual([0, 0]);
	});
});
