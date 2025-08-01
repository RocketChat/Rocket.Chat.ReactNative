import React, { memo, ReactNode } from 'react';
import { Text, View } from 'react-native';

import PlatformPressable from '../../../../lib/PlatformPressable';
import { isAndroid } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import { styles } from './styles';

interface IHeaderTitle {
	headerTitle?: string | ((props: { children: string; tintColor?: string }) => ReactNode);
	onPress?: () => void;
	disabled?: boolean;
	testID?: string;
	hitSlop?: { top: number; right: number; bottom: number; left: number };
}

const HeaderTitle = memo(({ 
	headerTitle, 
	onPress, 
	disabled = false, 
	testID,
	hitSlop 
}: IHeaderTitle) => {
	const { colors } = useTheme();
	
	if (!headerTitle) {
		return null;
	}

	const renderContent = () => {
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
	};

	if (onPress) {
		return (
			<PlatformPressable
				onPress={onPress}
				disabled={disabled}
				testID={testID}
				hitSlop={hitSlop}>
				{renderContent()}
			</PlatformPressable>
		);
	}

	return renderContent();
});

export default HeaderTitle;