import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import styles from './styles';

export interface ITableCell {
	align: '' | 'left' | 'center' | 'right';
	children: React.ReactElement | null;
	isLastCell: boolean;
}

export const CELL_WIDTH = 100;

const TableCell = React.memo(({ isLastCell, align, children }: ITableCell) => {
	const { colors } = useTheme();

	const cellStyle: ViewStyle[] = [styles.cell, { borderColor: colors.borderColor }];
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
			<Text style={[textStyle, { color: colors.bodyText }]}>{children}</Text>
		</View>
	);
});

export default TableCell;
