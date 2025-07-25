import React from 'react';
import { Text } from 'react-native';

import { MarkdownPreview } from '../../../markdown';
import { useTheme } from '../../../../theme';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import styles from './styles';
import { PlatformPressable } from '../../../PlatformPressable';

const TITLE_SIZE = 16;

type THeaderTitle = {
	title?: string;
	tmid?: string;
	prid?: string;
	scale?: number;
	testID?: string;
	onPress?: () => void;
};

const HeaderTitle = React.memo(({ title, prid, scale = 1, testID, onPress }: THeaderTitle) => {
	const { colors } = useTheme();
	const { isLargeFontScale } = useResponsiveLayout();

	const titleStyle = { fontSize: TITLE_SIZE * scale, color: colors.fontTitlesLabels };

	const content = prid ? (
		<MarkdownPreview msg={title} style={[styles.title, titleStyle]} testID={testID} />
	) : (
		<Text style={[styles.title, titleStyle]} numberOfLines={isLargeFontScale ? 2 : 1} testID={testID}>
			{title}
		</Text>
	);

	if (onPress) {
		return (
			<PlatformPressable onPress={onPress} testID={testID}>
				{content}
			</PlatformPressable>
		);
	}

	return content;
});

export default HeaderTitle;
