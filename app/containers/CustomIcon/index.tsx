import { memo, type ReactElement } from 'react';
import { StyleSheet, type ImageURISource, type StyleProp, type ViewStyle } from 'react-native';
import { renderToImageAsync } from 'expo-font';
import { createNanoIconSet } from 'react-native-nano-icons';

import { useTheme } from '~/theme';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import glyphMap from './nanoicons/custom.glyphmap.json';

export const IconSet = createNanoIconSet(glyphMap);

export type TIconsName = keyof typeof glyphMap.i;

export const hasIcon = (name: string): name is TIconsName => Object.hasOwn(glyphMap.i, name);

export const getIconImageSource = async (name: TIconsName, size: number, color: string): Promise<ImageURISource> => {
	const [, [[codepoint]]] = glyphMap.i[name] as [number, [number, string][]];
	const { uri, scale } = await renderToImageAsync(String.fromCodePoint(codepoint), { fontFamily: glyphMap.m.f, size, color });
	return { uri, scale };
};

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
