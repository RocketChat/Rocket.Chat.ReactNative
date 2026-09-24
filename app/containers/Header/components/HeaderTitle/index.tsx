import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { PlainText } from 'react-native-plain-text';

import { isAndroid } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
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
				<PlainText
					numberOfLines={1}
					style={{
						...styles.androidTitle,
						color: colors.fontTitlesLabels
					}}>
					{headerTitle}
				</PlainText>
			);
		}
		return (
			<View style={styles.headerTitleContainer}>
				<PlainText
					numberOfLines={1}
					style={{
						...styles.title,
						color: colors.fontTitlesLabels
					}}>
					{headerTitle}
				</PlainText>
			</View>
		);
	}

	return headerTitle({ children: '', tintColor: colors.fontTitlesLabels });
});

export default HeaderTitle;
