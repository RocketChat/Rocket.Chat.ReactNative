import React, { ReactNode } from 'react';
import { Text, TextStyle, View } from 'react-native';

import { isAndroid } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import { styles } from './styles';

interface IHeaderTitle {
	headerTitle?: string | ((props: { children: string; tintColor?: string }) => ReactNode);
	style?: TextStyle | object; // Specify the type for style as an object
}
const HeaderTitle = ({ headerTitle, style }: IHeaderTitle) => {
	const { colors } = useTheme();
	if (!headerTitle) {
		return null;
	}

	if (typeof headerTitle === 'string') {
		if (isAndroid) {
			return (
				<Text numberOfLines={1} style={style || { ...styles.androidTitle, color: colors.fontTitlesLabels }}>
					{headerTitle}
				</Text>
			);
		}
		return (
			<View style={[styles.headerTitleContainer]}>
				<Text numberOfLines={1} style={style || { ...styles.androidTitle, color: colors.fontTitlesLabels }}>
					{headerTitle}
				</Text>
			</View>
		);
	}

	return headerTitle({ children: '', tintColor: colors.fontTitlesLabels });
};

export default HeaderTitle;
