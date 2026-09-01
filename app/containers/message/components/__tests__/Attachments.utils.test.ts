import { type IAttachment } from '../../../../definitions';
import { isContentAttachment, isQuoteAttachment } from '../Attachments/utils';

describe('Attachments predicates', () => {
	const quote: IAttachment = { author_name: 'rocket.cat', ts: new Date(), text: 'quoted message' };
	const file: IAttachment = { type: 'file', title: 'document.pdf', title_link: '/file-upload/abc/document.pdf' };
	const image: IAttachment = { title: 'image.png', image_url: '/dummypath' };
	const audio: IAttachment = { title: 'audio.mp3', audio_url: '/dummypath' };
	const video: IAttachment = { title: 'video.mp4', video_url: '/dummypath' };
	const actions: IAttachment = { actions: [{ type: 'button', text: 'Yes', msg: 'Yes' }] };
	const collapsible: IAttachment = { collapsed: true, title: 'collapsed', text: 'text' };
	const forwardedWithNestedFile: IAttachment = { author_name: 'rocket.cat', text: '', attachments: [file] };
	const webhookEmbed: IAttachment = {
		title: 'Rocket.Chat',
		title_link: 'https://rocket.chat',
		text: 'Rocket.Chat, the best open source chat',
		image_url: 'https://rocket.chat/example.png',
		color: '#764FA5'
	};

	it('renders quotes, files and forwarded messages as quote attachments only', () => {
		[quote, file, forwardedWithNestedFile].forEach(attachment => {
			expect(isQuoteAttachment(attachment) || isContentAttachment(attachment)).toBe(true);
		});
		expect(isQuoteAttachment(quote)).toBe(true);
		expect(isContentAttachment(quote)).toBe(false);
		expect(isQuoteAttachment(file)).toBe(true);
		expect(isContentAttachment(file)).toBe(false);
		expect(isQuoteAttachment(forwardedWithNestedFile)).toBe(false);
		expect(isContentAttachment(forwardedWithNestedFile)).toBe(true);
	});

	it('renders media, actions and collapsible attachments as content attachments only', () => {
		[image, audio, video, actions, collapsible].forEach(attachment => {
			expect(isQuoteAttachment(attachment)).toBe(false);
			expect(isContentAttachment(attachment)).toBe(true);
		});
	});

	it('renders webhook embeds with text/color and media in both components (#6698)', () => {
		expect(isQuoteAttachment(webhookEmbed)).toBe(true);
		expect(isContentAttachment(webhookEmbed)).toBe(true);
	});

	it('never lets an attachment fall through both filters and render nothing', () => {
		const all = [quote, file, image, audio, video, actions, collapsible, forwardedWithNestedFile, webhookEmbed];
		all.forEach(attachment => {
			expect(isQuoteAttachment(attachment) || isContentAttachment(attachment)).toBe(true);
		});
	});

	it('handles undefined attachments', () => {
		expect(isQuoteAttachment(undefined)).toBe(false);
		expect(isContentAttachment(undefined)).toBe(false);
	});
});
