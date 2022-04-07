import React from 'react';
import { View } from 'react-native';

import { themes } from '../../lib/constants';
import styles from './styles';

interface IBlockQuote {
	children: React.ReactElement | null;
	theme: string;
}

const BlockQuote = React.memo(({ children, theme }: IBlockQuote) => (
	<View style={styles.container}>
		<View style={[styles.quote, { backgroundColor: themes[theme].borderColor }]} />
		<View style={styles.childContainer}>{children}</View>
	</View>
));

export default BlockQuote;
