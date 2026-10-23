import I18n from '..';

describe('isTranslated', () => {
	it('is true for a key of the English file', () => {
		expect(I18n.isTranslated('error-file-too-large')).toBe(true);
	});

	it('is false for text that is not a key', () => {
		expect(I18n.isTranslated('Storage quota exceeded')).toBe(false);
		expect(I18n.isTranslated(undefined)).toBe(false);
	});

	it('is false for a name inherited from Object.prototype', () => {
		expect(I18n.isTranslated('toString')).toBe(false);
		expect(I18n.isTranslated('constructor')).toBe(false);
		expect(I18n.isTranslated('__proto__')).toBe(false);
	});
});
