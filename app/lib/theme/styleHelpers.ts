import { PixelRatio, Platform } from 'react-native';

type TSupportedFontWeight = 'regular' | 'medium' | 'bold';
type TFontWeight = 'bold' | '400' | '500' | 'normal' | '100' | '200' | '300' | '600' | '700' | '800' | '900' | undefined;

export const fontWeight = (fWeight: TSupportedFontWeight): { fontFamily: string; fontWeight: TFontWeight } => {
	let fontFamily = 'Inter-Regular';
	let fontWeight = '400';

	if (fWeight === 'medium') {
		fontFamily = 'Inter-Medium';
		fontWeight = '500';
	}
	if (fWeight === 'bold') {
		fontFamily = 'Inter-Bold';
		fontWeight = 'bold';
	}

	return Platform.select({
		android: {
			fontFamily
		},
		ios: { fontWeight }
	}) as unknown as { fontFamily: string; fontWeight: TFontWeight };
};

const fontSizeRatio = (size: number) => {
	const ratio = PixelRatio.get();
	if (ratio === 1 || ratio === 1.5) {
		size -= 1;
	}
	if (ratio === 3 || ratio === 3.5) {
		size += 1;
	}
	return size;
};

export const fontSize = {
	10: fontSizeRatio(12),
	12: fontSizeRatio(12),
	14: fontSizeRatio(14),
	16: fontSizeRatio(16),
	18: fontSizeRatio(18),
	20: fontSizeRatio(20),
	22: fontSizeRatio(22),
	24: fontSizeRatio(24),
	26: fontSizeRatio(26)
};
