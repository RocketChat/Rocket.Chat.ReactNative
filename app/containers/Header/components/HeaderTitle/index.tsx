import React, { memo, type ReactNode } from 'react';
import { Text, type TextProps, View } from 'react-native';

import { isAndroid } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import { styles } from './styles';

interface IHeaderTitle {
	headerTitle?: string | ((props: { children: string; tintColor?: string }) => ReactNode);
	position?: 'left' | 'center' | 'right';
}

type HeaderTitleProps = IHeaderTitle & TextProps;
const HeaderTitle = memo(({ headerTitle, position, ...props }: HeaderTitleProps) => {
	'use memo';

	const { colors } = useTheme();
	if (!headerTitle) {
		return null;
	}

	if (typeof headerTitle === 'string') {
		if (isAndroid) {
			return (
				<Text
					numberOfLines={1}
					style={{
						...styles.androidTitle,
						color: colors.fontTitlesLabels,
						alignSelf: position === 'left' ? 'flex-start' : 'center'
					}}
					{...props}>
					{headerTitle}
				</Text>
			);
		}
		return (
			<View style={styles.headerTitleContainer}>
				<Text
					numberOfLines={1}
					style={{
						...styles.title,
						color: colors.fontTitlesLabels,
						alignSelf: position === 'left' ? 'flex-start' : 'center'
					}}
					{...props}>
					{headerTitle}
				</Text>
			</View>
		);
	}

	return headerTitle({ children: '', tintColor: colors.fontTitlesLabels });
});

export default HeaderTitle;
