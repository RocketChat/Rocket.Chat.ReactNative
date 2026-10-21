import type { TColors } from '~/theme';

export type TConferenceControlVariant = 'default' | 'danger' | 'toggled';

export type TConferenceControlColors = { background: string; icon: string };

export const getControlColors = (
	colors: TColors,
	variant: TConferenceControlVariant,
	pressed: boolean
): TConferenceControlColors => {
	switch (variant) {
		case 'danger':
			return {
				background: pressed ? colors.buttonBackgroundDangerPress : colors.buttonBackgroundDangerDefault,
				icon: colors.buttonFontDanger
			};
		case 'toggled':
			return { background: colors.buttonBackgroundSecondaryPress, icon: colors.fontInfo };
		default:
			return {
				background: pressed ? colors.buttonBackgroundSecondaryPress : colors.buttonBackgroundSecondaryDefault,
				icon: colors.buttonFontSecondary
			};
	}
};
