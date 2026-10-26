import { isSafeUrl } from '../isSafeUrl';

describe('isSafeUrl', () => {
	it('allows https and relative URLs', () => {
		expect(isSafeUrl('https://rocket.chat/')).toBe(true);
		expect(isSafeUrl('/channel/general')).toBe(true);
		expect(isSafeUrl('tel:+123456789')).toBe(true);
		expect(isSafeUrl('mailto:someone@rocket.chat')).toBe(true);
	});

	it('blocks code-execution schemes', () => {
		expect(isSafeUrl('javascript:alert(1)')).toBe(false);
		expect(isSafeUrl('data:text/html,<h1>hi</h1>')).toBe(false);
		expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
		expect(isSafeUrl('JaVaScRiPt:alert(1)')).toBe(false);
	});
});
