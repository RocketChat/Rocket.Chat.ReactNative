import withAlpha from './withAlpha';

describe('withAlpha', () => {
	test('rgba to be rgba with updated alpha', () => {
		expect(withAlpha('rgba(255, 0, 0, 0.2)', 0.8)).toBe('rgba(255, 0, 0, 0.8)');
	});

	test('rgb to be rgba with updated alpha', () => {
		expect(withAlpha('rgb(255, 0, 0)', 0.8)).toBe('rgba(255, 0, 0, 0.8)');
	});

	test('hex #rgb to be hex #rrggbbaa with updated alpha', () => {
		expect(withAlpha('#f00', 0.8)).toBe('#ff0000cc');
	});

	test('hex #rrggbb to be hex #rrggbbaa with updated alpha', () => {
		expect(withAlpha('#ff0000', 0.8)).toBe('#ff0000cc');
	});

	test('hex #rrggbbaa to be hex #rrggbbaa with updated alpha', () => {
		expect(withAlpha('#ff000022', 0.8)).toBe('#ff0000cc');
	});
});
