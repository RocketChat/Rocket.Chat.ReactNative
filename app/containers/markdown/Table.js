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
import { themes } from '../../constants/colors';

const MAX_HEIGHT = 300;

const Table = React.memo(({
	children, numColumns, theme
}) => {
	const getTableWidth = () => numColumns * CELL_WIDTH;

	const renderRows = (drawExtraBorders = true) => {
		const tableStyle = [styles.table, { borderColor: themes[theme].borderColor }];
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

	const onPress = () => Navigation.navigate('MarkdownTableView', { renderRows, tableWidth: getTableWidth() });

	return (
		<TouchableOpacity onPress={onPress}>
			<ScrollView
				contentContainerStyle={{ width: getTableWidth() }}
				scrollEnabled={false}
				showsVerticalScrollIndicator={false}
				style={[styles.containerTable, { maxWidth: getTableWidth(), maxHeight: MAX_HEIGHT, borderColor: themes[theme].borderColor }]}
			>
				{renderRows(false)}
			</ScrollView>
			<Text style={[styles.textInfo, { color: themes[theme].auxiliaryText }]}>{I18n.t('Full_table')}</Text>
		</TouchableOpacity>
	);
});

Table.propTypes = {
	children: PropTypes.node.isRequired,
	numColumns: PropTypes.number.isRequired,
	theme: PropTypes.string
};

export default Table;
