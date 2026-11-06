import getFileUrlAndTypeFromMessage from '../getFileUrlAndTypeFromMessage';

const legacyUrl = '/ufs/GridFS:Uploads/abc123/photo.png';

describe('getFileUrlAndTypeFromMessage', () => {
	it('builds an image url from the id and name, ignoring the stored url', () => {
		expect(getFileUrlAndTypeFromMessage({ _id: 'abc123', name: 'photo.png', type: 'image/png', url: legacyUrl })).toEqual({
			image_url: '/file-upload/abc123/photo.png',
			image_type: 'image/png'
		});
	});

	it('builds an audio url from the id and name', () => {
		expect(getFileUrlAndTypeFromMessage({ _id: 'abc123', name: 'song.mp3', type: 'audio/mpeg', url: legacyUrl })).toEqual({
			audio_url: '/file-upload/abc123/song.mp3',
			audio_type: 'audio/mpeg'
		});
	});

	it('builds a video url from the id and name', () => {
		expect(getFileUrlAndTypeFromMessage({ _id: 'abc123', name: 'clip.mp4', type: 'video/mp4', url: legacyUrl })).toEqual({
			video_url: '/file-upload/abc123/clip.mp4',
			video_type: 'video/mp4'
		});
	});

	it('builds a title link for other files', () => {
		expect(getFileUrlAndTypeFromMessage({ _id: 'abc123', name: 'report.pdf', type: 'application/pdf', url: legacyUrl })).toEqual({
			title_link: '/file-upload/abc123/report.pdf',
			type: 'file'
		});
	});

	it('works when the record has no stored url', () => {
		expect(getFileUrlAndTypeFromMessage({ _id: 'abc123', name: 'report.pdf', type: 'application/pdf' })).toEqual({
			title_link: '/file-upload/abc123/report.pdf',
			type: 'file'
		});
	});

	it.each([
		['spaces', 'my photo.png', 'my%20photo.png'],
		['a hash', 'file#1.png', 'file%231.png'],
		['a question mark', 'what?.png', 'what%3F.png'],
		['a percent sign', '100%.png', '100%25.png'],
		['a slash', 'a/b.png', 'a%2Fb.png'],
		['non-ascii characters', 'фото.png', '%D1%84%D0%BE%D1%82%D0%BE.png']
	])('encodes %s in the name', (_label, name, encoded) => {
		expect(getFileUrlAndTypeFromMessage({ _id: 'abc123', name, type: 'image/png' })).toEqual({
			image_url: `/file-upload/abc123/${encoded}`,
			image_type: 'image/png'
		});
	});
});
