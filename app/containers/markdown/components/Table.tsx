import { ScrollView, Text, View } from 'react-native';
import { type Table as TableProps, type TableCell } from '@rocket.chat/message-parser';

import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import styles from '../styles';
import Inline from './Inline';

interface ITableProps {
	value: TableProps['value'];
}

const alignmentStyle = (align: TableCell['align']) => {
	switch (align) {
		case 'center':
			return styles.alignCenter;
		case 'right':
			return styles.alignRight;
		default:
			return null;
	}
};

const Table = ({ value }: ITableProps) => {
	const { theme } = useTheme();
	const borderColor = { borderColor: themes[theme].strokeLight };
	const color = { color: themes[theme].fontDefault };

	const renderRow = (cells: TableCell[], isHeader: boolean) => (
		<View style={styles.row}>
			{cells.map((cell, index) => (
				<View key={`table-cell-${index}`} style={[styles.cell, styles.tableExtraBorders, styles.tableCell, borderColor]}>
					<Text style={[styles.text, isHeader && sharedStyles.textSemibold, alignmentStyle(cell.align), color]}>
						<Inline value={cell.value} />
					</Text>
				</View>
			))}
		</View>
	);

	return (
		<ScrollView horizontal showsHorizontalScrollIndicator={false}>
			<View style={[styles.table, borderColor]}>
				{renderRow(value.header, true)}
				{value.rows.map((row, index) => (
					<View key={`table-row-${index}`}>{renderRow(row.value, false)}</View>
				))}
			</View>
		</ScrollView>
	);
};

export default Table;
