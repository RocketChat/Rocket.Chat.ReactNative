import { renderHook } from '@testing-library/react-native';

import { useImageDescriptionLabel } from './useImageDescriptionLabel';
import { type IAttachment } from '../../definitions';

describe('useImageDescriptionLabel', () => {
	it('returns an empty string when there are no attachments', () => {
		const { result } = renderHook(() => useImageDescriptionLabel(undefined, 'hello'));
		expect(result.current).toBe('');
	});

	it('returns an empty string when no attachment has an image_url', () => {
		const attachments: IAttachment[] = [{ audio_url: 'https://example.com/audio.mp3', altText: 'should be ignored' }];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('');
	});

	it('returns an empty string when neither altText nor description is present', () => {
		const attachments: IAttachment[] = [{ image_url: 'https://example.com/image.png' }];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('');
	});

	it('uses altText from the first image attachment', () => {
		const attachments: IAttachment[] = [{ image_url: 'https://example.com/image.png', altText: 'A wavy pattern' }];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('Image description: A wavy pattern');
	});

	it('falls back to description when altText is missing', () => {
		const attachments: IAttachment[] = [{ image_url: 'https://example.com/image.png', description: 'Fallback description' }];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('Image description: Fallback description');
	});

	it('prefers altText over description when both are present', () => {
		const attachments: IAttachment[] = [
			{ image_url: 'https://example.com/image.png', altText: 'Alt text wins', description: 'Description loses' }
		];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('Image description: Alt text wins');
	});

	it('trims surrounding whitespace from the alt text', () => {
		const attachments: IAttachment[] = [{ image_url: 'https://example.com/image.png', altText: '   trimmed value   ' }];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('Image description: trimmed value');
	});

	it('ignores whitespace-only alt text and falls back to the next attachment', () => {
		const attachments: IAttachment[] = [
			{ image_url: 'https://example.com/first.png', altText: '   ' },
			{ image_url: 'https://example.com/second.png', altText: 'second image' }
		];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('Image description: second image');
	});

	it('returns an empty string when the alt text matches the message body', () => {
		const attachments: IAttachment[] = [{ image_url: 'https://example.com/image.png', altText: 'duplicate' }];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, '  duplicate  '));
		expect(result.current).toBe('');
	});

	it('picks the first non-empty alt text across multiple image attachments', () => {
		const attachments: IAttachment[] = [
			{ image_url: 'https://example.com/first.png' },
			{ image_url: 'https://example.com/second.png', altText: 'second image' },
			{ image_url: 'https://example.com/third.png', altText: 'third image' }
		];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('Image description: second image');
	});

	it('skips non-image attachments when picking alt text', () => {
		const attachments: IAttachment[] = [
			{ audio_url: 'https://example.com/audio.mp3', altText: 'audio alt - should be skipped' },
			{ image_url: 'https://example.com/image.png', altText: 'image alt' }
		];
		const { result } = renderHook(() => useImageDescriptionLabel(attachments, undefined));
		expect(result.current).toBe('Image description: image alt');
	});
});
