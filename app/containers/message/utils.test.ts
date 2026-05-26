import { getPreviewMessageFromAttachment } from './utils';

describe('getPreviewMessageFromAttachment', () => {
	test('returns the Attachment title when only title is set', () => {
		expect(getPreviewMessageFromAttachment({ title: 'example.png' })).toBe('example.png');
	});

	test('returns the Attachment description when description is set (description wins over title)', () => {
		expect(getPreviewMessageFromAttachment({ title: 'example.png', description: 'A nice photo' })).toBe('A nice photo');
	});

	test('returns the translated caption when translateLanguage matches (translation wins over description and title)', () => {
		expect(
			getPreviewMessageFromAttachment(
				{ title: 'example.png', description: 'A nice photo', translations: { 'pt-BR': 'Uma bela foto' } },
				'pt-BR'
			)
		).toBe('Uma bela foto');
	});

	test('returns undefined when nothing is set', () => {
		expect(getPreviewMessageFromAttachment({})).toBeUndefined();
	});

	test('falls back to description when translateLanguage is set but no matching translation exists', () => {
		expect(getPreviewMessageFromAttachment({ description: 'A nice photo', translations: { fr: 'Belle photo' } }, 'pt-BR')).toBe(
			'A nice photo'
		);
	});

	test('returns the Attachment title when only title is set even if translateLanguage is provided', () => {
		expect(getPreviewMessageFromAttachment({ title: 'example.png' }, 'pt-BR')).toBe('example.png');
	});
});
