import React, { memo, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isAndroid } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import { styles } from './styles';

interface IHeaderTitle {
	headerTitle?: string | ((props: { children: string; tintColor?: string }) => ReactNode);
}

const HeaderTitle = memo(({ headerTitle }: IHeaderTitle) => {
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
						color: colors.fontTitlesLabels
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
						color: colors.fontTitlesLabels
					}}>
					{headerTitle}
				</Text>
			</View>
		);
	}

	return headerTitle({ children: '', tintColor: colors.fontTitlesLabels });
});

export default HeaderTitle;
