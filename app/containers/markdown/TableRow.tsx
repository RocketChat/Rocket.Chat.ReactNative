import React from 'react';
import { View, ViewStyle } from 'react-native';

import { themes } from '../../lib/constants';
import styles from './styles';

interface ITableRow {
	children: React.ReactElement | null;
	isLastRow: boolean;
	theme: string;
}

const TableRow = React.memo(({ isLastRow, children: _children, theme }: ITableRow) => {
	const rowStyle: ViewStyle[] = [styles.row, { borderColor: themes[theme].borderColor }];
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
