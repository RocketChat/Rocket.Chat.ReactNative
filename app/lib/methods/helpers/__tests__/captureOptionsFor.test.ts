import { captureOptionsFor, VIDEO_QUALITY_ORDER } from '../captureOptionsFor';

describe('captureOptionsFor', () => {
	it('asks for no size at all for auto', () => {
		expect(captureOptionsFor('auto')).toEqual({});
	});

	it.each(VIDEO_QUALITY_ORDER.filter(quality => quality !== 'auto'))('asks for a widescreen picture for %s', quality => {
		const { width, height, aspectRatio } = captureOptionsFor(quality).resolution!;

		expect(aspectRatio).toBeCloseTo(16 / 9);
		expect(width / height).toBeCloseTo(aspectRatio);
	});
});
