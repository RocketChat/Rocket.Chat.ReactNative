import { useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { WAVEFORM_BAR_COUNT } from '~/lib/methods/audioWaveform/computeWaveformPeaks';
import { BAR_WIDTH, fitPeaks, layoutBars } from '../layoutBars';

const FLAT_PEAKS: number[] = new Array(WAVEFORM_BAR_COUNT).fill(0);

const centeredBarPositions = (count: number, gap: number, width: number) => {
	const barsWidth = count * BAR_WIDTH + (count - 1) * gap;
	const firstBarStart = (width - barsWidth) / 2;
	return Array.from({ length: count }, (_, index) => (firstBarStart + index * (BAR_WIDTH + gap) + BAR_WIDTH / 2) / width);
};

const evenBarPositions = (count: number) => Array.from({ length: count }, (_, index) => (index + 0.5) / count);

export const useWaveformBars = (peaks: number[] | undefined) => {
	const [width, setWidth] = useState<number>();
	const source = peaks?.length ? peaks : FLAT_PEAKS;
	const { count, gap } = width ? layoutBars(width, source.length) : { count: source.length, gap: 1 };
	const positions = width ? centeredBarPositions(count, gap, width) : evenBarPositions(count);
	const bars = fitPeaks(source, count).map((peak, index) => ({ peak, position: positions[index] }));
	const onLayout = (event: LayoutChangeEvent) => setWidth(Math.floor(event.nativeEvent.layout.width));
	return { bars, gap, onLayout };
};
