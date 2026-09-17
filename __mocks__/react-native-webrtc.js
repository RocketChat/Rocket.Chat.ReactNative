// The real module builds a NativeEventEmitter at import time, which throws under jest.
export const RTCAudioSession = {
	audioSessionDidActivate: jest.fn(),
	audioSessionDidDeactivate: jest.fn()
};

export const mediaDevices = {
	getUserMedia: jest.fn(() => Promise.resolve({ getAudioTracks: () => [] })),
	getDisplayMedia: jest.fn(() => Promise.resolve({ getAudioTracks: () => [] })),
	enumerateDevices: jest.fn(() => Promise.resolve([]))
};

export const registerGlobals = jest.fn();

export class MediaCallWebRTCProcessor {}
export class RTCPeerConnection {}
export class MediaStream {}
export class MediaStreamTrack {}
