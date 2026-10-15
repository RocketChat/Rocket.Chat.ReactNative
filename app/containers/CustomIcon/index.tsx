import { memo, type ReactElement } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { createNanoIconSet } from 'react-native-nano-icons';

import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import glyphMap from './nanoicons/custom.glyphmap.json';
import symbolMap from './nanoicons/custom.symbolmap.json';

const IconSet = createNanoIconSet(glyphMap);

export type TIconsName = keyof typeof glyphMap.i;

export const hasIcon = (name: string): name is TIconsName => Object.hasOwn(glyphMap.i, name);

export const iconAssetName = (name: TIconsName) => symbolMap.s[name];

export interface ICustomIcon {
	name: TIconsName;
	size: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	accessibilityLabel?: string;
}

const CustomIcon = memo(({ name, size, color, style, testID, accessibilityLabel }: ICustomIcon): ReactElement => {
	const { colors } = useTheme();
	const { fontScaleLimited } = useResponsiveLayout();

	return (
		<IconSet
			name={name}
			size={size * fontScaleLimited}
			color={color || colors.fontDefault}
			style={StyleSheet.flatten(style)}
			allowFontScaling={false}
			testID={testID}
			accessible={!!accessibilityLabel}
			accessibilityLabel={accessibilityLabel ?? ''}
		/>
	);
});

export { CustomIcon };
