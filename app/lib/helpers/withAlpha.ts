/**
 * Applies an alpha (opacity) value to a color string.
 *
 * Supported formats:
 * - `rgba(r,g,b,a)` → updates alpha
 * - `rgb(r,g,b)` → converted to `rgba`
 * - `#rgb`, `#rrggbb`, `#rrggbbaa` → normalized to `#rrggbbaa`
 *
 * Unsupported formats (returned unchanged):
 * - Named colors (`red`)
 * - `hsl()` / `hsla()`
 * - Invalid color strings
 *
 * @param color Input color string
 * @param alpha Opacity value between `0` and `1` (default: `1`)
 */
const withAlpha = (color: string, alpha: number = 1) => {
	if (!color) {
		return color;
	}

	// case rgba
	if (color.startsWith('rgba')) {
		const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/);

		if (!match) {
			return color;
		}

		const [, r, g, b] = match;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	// case rgb
	if (color.startsWith('rgb')) {
		const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);

		if (!match) {
			return color;
		}

		const [, r, g, b] = match;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	// case hex
	if (color.startsWith('#')) {
		let hex = color.slice(1);

		// #rgb → #rrggbb
		if (hex.length === 3) {
			hex = hex
				.split('')
				.map(c => c + c)
				.join('');
		}

		if (hex.length === 8) {
			hex = hex.substring(0, 6);
		}
		if (hex.length !== 6) {
			return color;
		}

		const alphaHex = Math.round(alpha * 255)
			.toString(16)
			.padStart(2, '0');

		return `#${hex}${alphaHex}`;
	}

	// named colors / invalid strings
	return color;
};

export default withAlpha;
