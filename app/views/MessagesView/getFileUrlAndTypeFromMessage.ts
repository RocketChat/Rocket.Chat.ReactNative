export default function (message: { type: string; url: string }) {
	if (/image/.test(message.type)) {
		return { image_url: message.url, image_type: message.type };
	}
	if (/audio/.test(message.type)) {
		return { audio_url: message.url, audio_type: message.type };
	}
	if (/video/.test(message.type)) {
		return { video_url: message.url, video_type: message.type };
	}
	return {
		title_link: message.url,
		type: 'file'
	};
}
