export interface IMediaStreamRenderer {
	/* @deprecated */
	localMediaElement?: HTMLMediaElement; // TODO: Understand the usage of localMediaElement
	remoteMediaElement: HTMLMediaElement;
}
