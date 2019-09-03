import { PropTypes } from 'prop-types';
import React from 'react';
import {
	ScrollView,
	TouchableOpacity,
	View,
	Text
} from 'react-native';

import { CELL_WIDTH } from './TableCell';
import styles from './styles';
import Navigation from '../../lib/Navigation';
import I18n from '../../i18n';

const MAX_HEIGHT = 300;

const Table = React.memo(({
	children, numColumns
}) => {
	const getTableWidth = () => numColumns * CELL_WIDTH;

	const renderRows = (drawExtraBorders = true) => {
		const tableStyle = [styles.table];
		if (drawExtraBorders) {
			tableStyle.push(styles.tableExtraBorders);
		}

		const rows = React.Children.toArray(children);
		rows[rows.length - 1] = React.cloneElement(rows[rows.length - 1], {
			isLastRow: true
		});

		return (
			<View style={tableStyle}>
				{rows}
			</View>
		);
	};

	const onPress = () => Navigation.navigate('TableView', { renderRows, tableWidth: getTableWidth() });

	return (
		<TouchableOpacity onPress={onPress}>
			<ScrollView
				contentContainerStyle={{ width: getTableWidth() }}
				scrollEnabled={false}
				showsVerticalScrollIndicator={false}
				style={[styles.containerTable, { maxWidth: getTableWidth(), maxHeight: MAX_HEIGHT }]}
			>
				{renderRows(false)}
			</ScrollView>
			<Text style={styles.textInfo}>{I18n.t('Full_table')}</Text>
		</TouchableOpacity>
	);
});

Table.propTypes = {
	children: PropTypes.node.isRequired,
	numColumns: PropTypes.number.isRequired
};

export default Table;
