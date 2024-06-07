import React from 'react';
import { View } from 'react-native';

import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';
import styles from './styles';

interface IBlockQuote {
	children: React.ReactElement | null;
	theme: TSupportedThemes;
}

const BlockQuote = React.memo(({ children, theme }: IBlockQuote) => (
	<View style={styles.container}>
		<View style={[styles.quote, { backgroundColor: themes[theme].strokeLight }]} />
		<View style={styles.childContainer}>{children}</View>
	</View>
));

export default BlockQuote;
