import React, { memo, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isAndroid } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import { styles } from './styles';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface IHeaderTitle {
	headerTitle?: string | ((props: { children: string; tintColor?: string }) => ReactNode);
}

const HeaderTitle = memo(({ headerTitle }: IHeaderTitle) => {
	'use memo';

	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
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
						fontSize: scaleFontSize(18),
						lineHeight: scaleFontSize(24)
					}}>
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
						fontSize: scaleFontSize(18),
						lineHeight: scaleFontSize(24)
					}}>
					{headerTitle}
				</Text>
			</View>
		);
	}

	return headerTitle({ children: '', tintColor: colors.fontTitlesLabels });
});

export default HeaderTitle;
