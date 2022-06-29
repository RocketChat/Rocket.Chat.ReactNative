import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../theme';
import styles from './styles';

interface IBlockQuote {
	children: React.ReactElement | null;
}

const BlockQuote = React.memo(({ children }: IBlockQuote) => {
	const { colors } = useTheme();
	return (
		<View style={styles.container} testID='markdown-block-quote'>
			<View style={[styles.quote, { backgroundColor: colors.borderColor }]} />
			<View style={styles.childContainer}>{children}</View>
		</View>
	);
});

export default BlockQuote;
