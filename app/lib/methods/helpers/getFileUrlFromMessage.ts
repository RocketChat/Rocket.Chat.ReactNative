export default function (message: { type: string; url: string }) {
	if (/image/.test(message.type)) {
		return { image_url: message.url };
	}
	if (/audio/.test(message.type)) {
		return { audio_url: message.url };
	}
	if (/video/.test(message.type)) {
		return { video_url: message.url };
	}
	return {
		title_link: message.url,
		type: 'file'
	};
}
