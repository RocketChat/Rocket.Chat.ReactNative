import { cameraSourceFor } from '../cameraSourceFor';

describe('cameraSourceFor', () => {
	it('asks for the camera the user picked by its id, and nothing about which way it faces', () => {
		expect(cameraSourceFor('environment', '2')).toEqual({ deviceId: { exact: '2' } });
	});

	it('asks for whichever camera faces the way the user chose when none was picked by id', () => {
		expect(cameraSourceFor('user', undefined)).toEqual({ facingMode: 'user' });
	});
});
