import { pickCameraDevices } from '../pickCameraDevices';

const camera = (deviceId: string, facing: string, label = deviceId) => ({ kind: 'videoinput', deviceId, facing, label });

describe('pickCameraDevices', () => {
	it('keeps only the cameras, in the order the system listed them', () => {
		const devices = [
			camera('1', 'front'),
			{ kind: 'audioinput', deviceId: 'audio-1', label: 'Audio' },
			camera('0', 'environment')
		];

		expect(pickCameraDevices(devices).map(({ deviceId }) => deviceId)).toEqual(['1', '0']);
	});

	it('says which way each camera faces, for the mirror and for a camera picked by id', () => {
		const [front, back] = pickCameraDevices([camera('1', 'front'), camera('0', 'environment')]);

		expect(front.facing).toBe('user');
		expect(back.facing).toBe('environment');
	});

	it('numbers cameras that face the same way, so they can be told apart, and nobody else', () => {
		const devices = pickCameraDevices([camera('0', 'environment'), camera('1', 'front'), camera('2', 'environment')]);

		expect(devices.map(({ ordinal }) => ordinal)).toEqual([1, undefined, 2]);
	});

	it('does not say which way a camera faces that faces neither way, such as an external one', () => {
		const [external] = pickCameraDevices([camera('usb', 'unknown')]);

		expect(external.facing).toBeUndefined();
	});

	it('uses the name the system gave a camera', () => {
		const [wide] = pickCameraDevices([camera('uid-1', 'environment', 'Back Ultra Wide Camera')]);

		expect(wide.label).toBe('Back Ultra Wide Camera');
	});

	it('gives no name to a camera the system only calls by a number, so one can be made from where it faces', () => {
		const [back] = pickCameraDevices([camera('0', 'environment', '0')]);

		expect(back.label).toBeUndefined();
	});

	it.each([[undefined], [null], ['cameras'], [{}], [[null, 3, 'x']]])('finds no cameras in %p', devices => {
		expect(pickCameraDevices(devices)).toEqual([]);
	});
});
