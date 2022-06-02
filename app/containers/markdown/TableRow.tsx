import React from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import styles from './styles';

export interface ITableRow {
	children: React.ReactElement | null;
	isLastRow: boolean;
}

const TableRow = React.memo(({ isLastRow, children: _children }: ITableRow) => {
	const { colors } = useTheme();

	const rowStyle: ViewStyle[] = [styles.row, { borderColor: colors.borderColor }];
	if (!isLastRow) {
		rowStyle.push(styles.rowBottomBorder);
	}

	const children = React.Children.toArray(_children) as React.ReactElement[];
	children[children.length - 1] = React.cloneElement(children[children.length - 1], {
		isLastCell: true
	});

	return <View style={rowStyle}>{children}</View>;
});

export default TableRow;
