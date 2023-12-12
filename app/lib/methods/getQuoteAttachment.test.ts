import { getQuoteMessageLink } from './getQuoteMessageLink';

const imageAttachment = [
	{
		ts: '1970-01-01T00:00:00.000Z',
		title: 'IMG_0058.MP4',
		title_link: '/file-upload/34q5BbCRW3wCauiDt/IMG_0058.MP4',
		title_link_download: true,
		video_url: '/file-upload/34q5BbCRW3wCauiDt/IMG_0058.MP4',
		video_type: 'video/mp4',
		video_size: 4867328,
		type: 'file',
		fields: [],
		attachments: []
	}
];

const imageAttachmentWithAQuote = [
	...imageAttachment,

	{
		text: '[ ](https://mobile.rocket.chat/group/channel-etc?msg=cIqhbvkOSgiCOK4Wh) \nhttps://www.youtube.com/watch?v=5yx6BWlEVcY',
		md: [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'LINK',
						value: {
							src: { type: 'PLAIN_TEXT', value: 'https://mobile.rocket.chat/group/channel-etc?msg=cIqhbvkOSgiCOK4Wh' },
							label: [{ type: 'PLAIN_TEXT', value: ' ' }]
						}
					},
					{ type: 'PLAIN_TEXT', value: ' ' }
				]
			},
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'LINK',
						value: {
							src: { type: 'PLAIN_TEXT', value: 'https://www.youtube.com/watch?v=5yx6BWlEVcY' },
							label: [{ type: 'PLAIN_TEXT', value: 'https://www.youtube.com/watch?v=5yx6BWlEVcY' }]
						}
					}
				]
			}
		],
		message_link: 'https://mobile.rocket.chat/group/channel-etc?msg=n5WaK5NRJN42Hg26w',
		author_name: 'user-two',
		author_icon: '/avatar/user-two',
		attachments: [
			{
				text: 'https://www.youtube.com/watch?v=5yx6BWlEVcY',
				md: [
					{
						type: 'PARAGRAPH',
						value: [
							{
								type: 'LINK',
								value: {
									src: { type: 'PLAIN_TEXT', value: 'https://www.youtube.com/watch?v=5yx6BWlEVcY' },
									label: [{ type: 'PLAIN_TEXT', value: 'https://www.youtube.com/watch?v=5yx6BWlEVcY' }]
								}
							}
						]
					}
				],
				message_link: 'https://mobile.rocket.chat/group/channel-etc?msg=cIqhbvkOSgiCOK4Wh',
				author_name: 'user-two',
				author_icon: '/avatar/user-two',
				ts: '2023-11-23T14:10:18.520Z',
				fields: [],
				attachments: []
			}
		],
		ts: '2023-11-23T17:47:51.676Z',
		fields: []
	}
];

describe('Test the getQuoteMessageLink', () => {
	it('return undefined from a message without attachment', () => {
		expect(getQuoteMessageLink([])).toBe(undefined);
	});
	it('return undefined from a message with image attachment', () => {
		expect(getQuoteMessageLink(imageAttachment)).toBe(undefined);
	});
	it('return the message link from an image message with a quote', () => {
		const expectedResult = 'https://mobile.rocket.chat/group/channel-etc?msg=n5WaK5NRJN42Hg26w';
		expect(getQuoteMessageLink(imageAttachmentWithAQuote)).toBe(expectedResult);
	});
});
