/**
 * This class is used for local stream manipulation.
 * @remarks
 * This class wraps up browser media stream and HTMLMedia element
 * and takes care of rendering the media on a given element.
 * This provides enough abstraction so that the higher level
 * classes do not need to know about the browser specificities for
 * media.
 * This will also provide stream related functionalities such as
 * mixing of 2 streams in to 2, adding/removing tracks, getting a track information
 * detecting voice energy etc. Which will be implemented as when needed
 */

import { MediaStream, RTCPeerConnection } from 'react-native-webrtc';

import Stream from './Stream';

export default class RemoteStream extends Stream {
	constructor(mediaStream: MediaStream) {
		super(mediaStream);
	}

	/**
	 * Called for playing the stream
	 * @remarks
	 * Plays the stream on media element. Stream will be autoplayed and muted based on the settings.
	 * throws and error if the play fails.
	 */
	play(): void {
		if (!this.mediaStream || this.mediaStream.getAudioTracks().length === 0) {
			throw Error('No audio tracks available in the media stream.');
		}

		const [audioTrack] = this.mediaStream.getAudioTracks();
		const peerConnection = new RTCPeerConnection();

		peerConnection.addTrack(audioTrack, this.mediaStream);
	}
}
