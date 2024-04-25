import React from 'react';
import { Text, View } from 'react-native';

import Touch from '../../containers/Touch';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import styles from './styles';

interface SidebarItemProps {
	left: JSX.Element;
	right?: JSX.Element;
	text: string;
	textColor?: string;
	current?: boolean;
	onPress(): void;
	testID: string;
	theme: TSupportedThemes;
}

const Item = React.memo(({ left, right, text, onPress, testID, current, theme, textColor }: SidebarItemProps) => (
	<Touch
		key={testID}
		testID={testID}
		onPress={onPress}
		style={[styles.item, current && { backgroundColor: themes[theme].strokeLight }]}
	>
		<View style={styles.itemHorizontal}>{left}</View>
		<View style={styles.itemCenter}>
			<Text
				style={[styles.itemText, { color: textColor || themes[theme].fontTitlesLabels }]}
				numberOfLines={1}
				accessibilityLabel={text}
			>
				{text}
			</Text>
		</View>
		<View style={styles.itemHorizontal}>{right}</View>
	</Touch>
));

export default withTheme(Item);
