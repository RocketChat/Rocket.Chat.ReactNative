import type { TColors } from '~/theme';

export type TRaisedHandColors = { background: string; text: string };

export const getRaisedHandColors = (colors: TColors, isSelf: boolean): TRaisedHandColors =>
	isSelf
		? { background: colors.buttonBackgroundSuccessDefault, text: colors.buttonFontSuccess }
		: { background: colors.fontPureWhite, text: colors.fontPureBlack };
