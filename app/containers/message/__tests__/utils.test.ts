import { getPreviewMessageFromAttachment } from '../utils';

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

	test('decodes a percent-encoded Cyrillic title', () => {
		expect(getPreviewMessageFromAttachment({ title: '%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf' })).toBe('Пример.pdf');
	});

	test('does not decode the description', () => {
		expect(getPreviewMessageFromAttachment({ title: '%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf', description: '100% sure' })).toBe(
			'100% sure'
		);
	});

	test('falls back to the title when the description is an empty string', () => {
		expect(getPreviewMessageFromAttachment({ title: 'example.png', description: '' })).toBe('example.png');
	});

	test('translation wins over an encoded title', () => {
		expect(
			getPreviewMessageFromAttachment(
				{ title: '%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf', translations: { 'pt-BR': 'Uma bela foto' } },
				'pt-BR'
			)
		).toBe('Uma bela foto');
	});
});
