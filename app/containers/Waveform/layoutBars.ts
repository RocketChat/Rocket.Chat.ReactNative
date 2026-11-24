export const BAR_WIDTH = 3;
const MIN_BAR_GAP = 1;

export const layoutBars = (width: number, maxBars: number): { count: number; gap: number } => {
	const count = Math.max(1, Math.min(maxBars, Math.floor((width + MIN_BAR_GAP) / (BAR_WIDTH + MIN_BAR_GAP))));
	if (count < 2) {
		return { count, gap: MIN_BAR_GAP };
	}
	return { count, gap: Math.max(MIN_BAR_GAP, Math.floor((width - count * BAR_WIDTH) / (count - 1))) };
};

export const fitPeaks = (peaks: number[], count: number): number[] => {
	if (count >= peaks.length) {
		return peaks;
	}
	return Array.from({ length: count }, (_, index) => {
		const start = Math.floor((index * peaks.length) / count);
		const end = Math.floor(((index + 1) * peaks.length) / count);
		return Math.max(...peaks.slice(start, end));
	});
};
