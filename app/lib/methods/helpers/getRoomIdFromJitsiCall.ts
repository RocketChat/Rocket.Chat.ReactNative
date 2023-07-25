export const getRoomIdFromJitsiCallUrl = (jitsiCallUrl: string): string => {
	const url = jitsiCallUrl
		?.split(/^https?:\/\//)[1]
		?.split('#')[0]
		?.split('/')[1];

	const roomId = url.includes('?jwt') ? url.split('?jwt')[0] : url;
	return roomId;
};
