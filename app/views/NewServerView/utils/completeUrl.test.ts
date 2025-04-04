import completeUrl from './completeUrl';

describe('completeUrl', () => {
	it('should remove authentication from URL', () => {
		expect(completeUrl('https://user:pass@example.com')).toBe('https://example.com');
	});

	it('should trim spaces from URL', () => {
		expect(completeUrl('  https://example.com  ')).toBe('https://example.com');
	});

	it('should append .rocket.chat if the input is a short identifier', () => {
		expect(completeUrl('mobile')).toBe('https://mobile.rocket.chat');
	});

	it('should not modify a valid URL', () => {
		expect(completeUrl('https://mobile.rocket.chat')).toBe('https://mobile.rocket.chat');
	});

	it('should add https:// if missing', () => {
		expect(completeUrl('mobile.rocket.chat')).toBe('https://mobile.rocket.chat');
	});

	it('should handle localhost correctly', () => {
		expect(completeUrl('localhost')).toBe('http://localhost');
		expect(completeUrl('localhost:3000')).toBe('http://localhost:3000');
	});

	it('should replace backslashes with forward slashes', () => {
		expect(completeUrl('https://example.com\\path')).toBe('https://example.com/path');
	});

	it('should remove trailing slashes', () => {
		expect(completeUrl('https://mobile.rocket.chat/')).toBe('https://mobile.rocket.chat');
	});
});
