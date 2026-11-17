export default function (file: { _id: string; name: string; type: string; url?: string }) {
	const url = `/file-upload/${file._id}/${encodeURIComponent(file.name)}`;
	if (/image/.test(file.type)) {
		return { image_url: url, image_type: file.type };
	}
	if (/audio/.test(file.type)) {
		return { audio_url: url, audio_type: file.type };
	}
	if (/video/.test(file.type)) {
		return { video_url: url, video_type: file.type };
	}
	return {
		title_link: url,
		type: 'file'
	};
}
