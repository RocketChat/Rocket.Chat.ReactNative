import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useSecondaryLabelColor } from '~/containers/List/hooks/useSecondaryLabelColor';
import styles from '../styles';

interface INativeListSectionHeader {
	title: string;
	trailing?: ReactNode;
	testID?: string;
}

const NativeListSectionHeader = ({ title, trailing, testID }: INativeListSectionHeader) => {
	const secondaryLabel = useSecondaryLabelColor();

	return (
		<View style={styles.headerRow}>
			<Text testID={testID} accessibilityRole='header' style={[styles.header, { color: secondaryLabel }]}>
				{title}
			</Text>
			{trailing ? <View style={styles.headerTrailing}>{trailing}</View> : null}
		</View>
	);
};

export default NativeListSectionHeader;
