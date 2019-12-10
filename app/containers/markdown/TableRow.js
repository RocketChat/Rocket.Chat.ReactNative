import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';

import { themes } from '../../constants/colors';

import styles from './styles';

const TableRow = React.memo(({
	isLastRow, children: _children, theme
}) => {
	const rowStyle = [styles.row, { borderColor: themes[theme].borderColor }];
	if (!isLastRow) {
		rowStyle.push(styles.rowBottomBorder);
	}

	const children = React.Children.toArray(_children);
	children[children.length - 1] = React.cloneElement(children[children.length - 1], {
		isLastCell: true
	});

	return <View style={rowStyle}>{children}</View>;
});

TableRow.propTypes = {
	children: PropTypes.node,
	isLastRow: PropTypes.bool,
	theme: PropTypes.string
};

export default TableRow;
