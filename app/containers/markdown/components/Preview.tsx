import React from 'react';
import { Text, View, type TextStyle } from 'react-native';

import { themes } from '../../../lib/constants/colors';
import { useTheme } from '../../../theme';
import usePreviewFormatText from '../../../lib/hooks/usePreviewFormatText';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import styles from '../styles';

interface IMarkdownPreview {
	msg?: string;
	numberOfLines?: number;
	testID?: string;
	style?: TextStyle[];
}

const MarkdownPreview = ({ msg, numberOfLines = 1, style = [], testID }: IMarkdownPreview) => {
	const { theme } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	const formattedText = usePreviewFormatText(msg ?? '');

	if (!msg) {
		return null;
	}
	const m = formattedText;
	const fontSize = scaleFontSize(18);
	const lineHeight = fontSize * 1.375; // 16 * 1.375 = 22, scaled proportionally

	return (
		<View style={{ flex: 1, minWidth: 0 }}>
			<Text
				accessibilityLabel={m}
				style={[styles.text, { color: themes[theme].fontDefault, fontSize, lineHeight, flexShrink: 1 }, ...style]}
				numberOfLines={numberOfLines}
				ellipsizeMode='tail'
				adjustsFontSizeToFit={false}
				testID={testID || `markdown-preview-${m}`}>
				{m}
			</Text>
		</View>
	);
};

export default MarkdownPreview;
