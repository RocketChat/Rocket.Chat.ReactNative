import { mediaDevices } from 'react-native-webrtc';

/**
 * Gate in front of `getUserMedia` for the VoIP signaling session.
 *
 * `MediaSignalingSession.updateState()` re-requests the input track on every state change while a
 * call is busy, so releasing the track once is not enough to keep the microphone free. While the
 * gate is suspended, requests park instead of opening the device; the session's own
 * `callsToGetUserMedia` guard then stops it from issuing more.
 */

let suspended = false;
let parked: Array<() => void> = [];

export function isCaptureSuspended(): boolean {
	return suspended;
}

export function hasParkedCaptureRequest(): boolean {
	return parked.length > 0;
}

export function suspendCapture(): void {
	suspended = true;
}

/** Lets parked requests proceed. Returns how many were released. */
export function resumeCapture(): number {
	suspended = false;
	const waiters = parked;
	parked = [];
	waiters.forEach(resume => resume());
	return waiters.length;
}

export async function gatedGetUserMedia(constraints: unknown): Promise<MediaStream> {
	if (suspended) {
		await new Promise<void>(resolve => {
			parked.push(resolve);
		});
	}
	return mediaDevices.getUserMedia(constraints as any) as unknown as Promise<MediaStream>;
}
