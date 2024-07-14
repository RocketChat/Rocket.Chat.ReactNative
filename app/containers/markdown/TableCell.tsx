import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';
import styles from './styles';

interface ITableCell {
	align: '' | 'left' | 'center' | 'right';
	children: React.ReactElement | null;
	isLastCell: boolean;
	theme: TSupportedThemes;
}

export const CELL_WIDTH = 100;

const TableCell = React.memo(({ isLastCell, align, children, theme }: ITableCell) => {
	const cellStyle: ViewStyle[] = [styles.cell, { borderColor: themes[theme].strokeLight }];
	if (!isLastCell) {
		cellStyle.push(styles.cellRightBorder);
	}

	let textStyle = null;
	if (align === 'center') {
		textStyle = styles.alignCenter;
	} else if (align === 'right') {
		textStyle = styles.alignRight;
	}

	return (
		<View style={[...cellStyle, { width: CELL_WIDTH }]}>
			<Text style={[textStyle, { color: themes[theme].fontDefault }]}>{children}</Text>
		</View>
	);
});

export default TableCell;
