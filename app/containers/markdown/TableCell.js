import PropTypes from 'prop-types';
import React from 'react';
import { Text, View } from 'react-native';

import styles from './styles';

export const CELL_WIDTH = 100;

const TableCell = React.memo(({
	isLastCell, align, children
}) => {
	const cellStyle = [styles.cell];
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
			<Text style={textStyle}>
				{children}
			</Text>
		</View>
	);
});

TableCell.propTypes = {
	align: PropTypes.oneOf(['', 'left', 'center', 'right']),
	children: PropTypes.node,
	isLastCell: PropTypes.bool
};

export default TableCell;
