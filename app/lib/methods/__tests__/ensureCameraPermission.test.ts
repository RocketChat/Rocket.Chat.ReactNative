import { Camera } from 'expo-camera';

import { ensureCameraPermission } from '../ensureCameraPermission';

jest.mock('expo-camera', () => ({
	Camera: {
		getCameraPermissionsAsync: jest.fn(),
		requestCameraPermissionsAsync: jest.fn()
	}
}));

const current = Camera.getCameraPermissionsAsync as jest.Mock;
const request = Camera.requestCameraPermissionsAsync as jest.Mock;

describe('ensureCameraPermission', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('does not ask again once the camera is allowed', async () => {
		current.mockResolvedValue({ granted: true, canAskAgain: true });

		await expect(ensureCameraPermission()).resolves.toBe(true);

		expect(request).not.toHaveBeenCalled();
	});

	it('asks, and reports what the user answered', async () => {
		current.mockResolvedValue({ granted: false, canAskAgain: true });
		request.mockResolvedValueOnce({ granted: true }).mockResolvedValueOnce({ granted: false });

		await expect(ensureCameraPermission()).resolves.toBe(true);
		await expect(ensureCameraPermission()).resolves.toBe(false);
	});

	it('does not raise a prompt the system would not show after a permanent refusal', async () => {
		current.mockResolvedValue({ granted: false, canAskAgain: false });

		await expect(ensureCameraPermission()).resolves.toBe(false);

		expect(request).not.toHaveBeenCalled();
	});
});
