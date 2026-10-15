import { captureOptionsFor } from '../captureOptionsFor';

describe('captureOptionsFor', () => {
	it('asks for no size at all for auto', () => {
		expect(captureOptionsFor('auto')).toEqual({});
	});

	it('asks for 1080p at 30 frames per second', () => {
		expect(captureOptionsFor('h1080')).toEqual({ resolution: { width: 1920, height: 1080, frameRate: 30, aspectRatio: 16 / 9 } });
	});

	it('asks for 720p at 30 frames per second', () => {
		expect(captureOptionsFor('h720')).toEqual({ resolution: { width: 1280, height: 720, frameRate: 30, aspectRatio: 16 / 9 } });
	});

	it('asks for 360p at 20 frames per second', () => {
		expect(captureOptionsFor('h360')).toEqual({ resolution: { width: 640, height: 360, frameRate: 20, aspectRatio: 16 / 9 } });
	});

	it('asks for 180p at 20 frames per second', () => {
		expect(captureOptionsFor('h180')).toEqual({ resolution: { width: 320, height: 180, frameRate: 20, aspectRatio: 16 / 9 } });
	});
});
