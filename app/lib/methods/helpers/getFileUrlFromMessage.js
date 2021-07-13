export default function(message) {
	if (/image/.test(message.type)) {
		return { image_url: message.url };
	}
	if (/audio/.test(message.type)) {
		return { audio_url: message.url };
	}
	if (/video/.test(message.type)) {
		let video_url = message.url;
		const regUfsUpload = /ufs\/.*Uploads/;
		if (regUfsUpload.test(video_url)) {
			video_url = video_url.replace(regUfsUpload, 'file-upload');
		}

		return { video_url, video_type: message.type };
	}
	return {
		title_link: message.url,
		type: 'file'
	};
}
