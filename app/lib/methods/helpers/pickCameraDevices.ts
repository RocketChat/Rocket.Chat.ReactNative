import { type TCameraFacing } from './cameraSourceFor';

export type TCameraDevice = {
	deviceId: string;
	facing: TCameraFacing | undefined;
	ordinal: number | undefined;
	label: string | undefined;
};

type TRawCamera = { deviceId: string; facing?: unknown; label?: unknown };

const FACING_OF_RAW: Record<string, TCameraFacing> = { front: 'user', environment: 'environment' };

const isCamera = (device: unknown): device is TRawCamera & { kind: 'videoinput' } =>
	typeof device === 'object' &&
	device !== null &&
	(device as { kind?: unknown }).kind === 'videoinput' &&
	typeof (device as { deviceId?: unknown }).deviceId === 'string';

const readableLabel = (label: unknown): string | undefined =>
	typeof label === 'string' && /[a-z]/i.test(label) ? label : undefined;

export const pickCameraDevices = (devices: unknown): TCameraDevice[] => {
	const cameras = (Array.isArray(devices) ? devices.filter(isCamera) : []).map(({ deviceId, facing, label }) => ({
		deviceId,
		facing: FACING_OF_RAW[String(facing)],
		label: readableLabel(label)
	}));
	const sameFacing = (facing: TCameraFacing | undefined) => cameras.filter(camera => camera.facing === facing);
	return cameras.map(camera => {
		const peers = sameFacing(camera.facing);
		return { ...camera, ordinal: peers.length > 1 ? peers.indexOf(camera) + 1 : undefined };
	});
};
