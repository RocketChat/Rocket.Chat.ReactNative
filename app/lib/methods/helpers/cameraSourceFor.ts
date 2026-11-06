export type TCameraFacing = 'user' | 'environment';

export const cameraSourceFor = (facing: TCameraFacing, deviceId: string | undefined) =>
	deviceId ? { deviceId: { exact: deviceId } } : { facingMode: facing };
