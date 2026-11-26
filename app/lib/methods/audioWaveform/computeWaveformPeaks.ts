export const WAVEFORM_BAR_COUNT = 40;

export const computeWaveformPeaks = (samples: ArrayLike<number>, barCount = WAVEFORM_BAR_COUNT): number[] => {
	const blockSize = Math.floor(samples.length / barCount);
	if (!blockSize) {
		return [];
	}

	const peaks = Array.from({ length: barCount }, (_, bar) => {
		let peak = 0;
		const end = (bar + 1) * blockSize;
		for (let index = bar * blockSize; index < end; index += 1) {
			peak = Math.max(peak, Math.abs(samples[index]));
		}
		return peak;
	});

	const loudest = Math.max(...peaks);
	return loudest ? peaks.map(peak => peak / loudest) : peaks;
};
