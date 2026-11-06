import { type ReactElement } from 'react';
import { transparentize } from 'color2k';
import { type StyleProp, type TextStyle, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { type Table as TableProps, type TableCell } from '@rocket.chat/message-parser';

import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { getTableColumnWidths } from '~/lib/methods/helpers/getTableColumnWidths';
import MarkdownContext, { useMarkdownContext } from '../contexts/MarkdownContext';
import styles from '../styles';
import Inline from './Inline';

const IMAGE_SIZE = 48;
const ROW_STRIPE_TRANSPARENCY = 0.95;

interface ITableProps {
	value: TableProps['value'];
}

interface ICellProps {
	cell: TableCell;
	width: number;
	isHeader: boolean;
}

const getAlignStyles = (align: TableCell['align']): { text?: TextStyle; cell?: ViewStyle } => {
	switch (align) {
		case 'center':
			return { text: styles.alignCenter, cell: styles.cellAlignCenter };
		case 'right':
			return { text: styles.alignRight, cell: styles.cellAlignRight };
		default:
			return {};
	}
};

const Cell = ({ cell, width, isHeader }: ICellProps): ReactElement => {
	const { colors } = useTheme();
	const alignStyles = getAlignStyles(cell.align);
	const textContext = useMarkdownContext([
		styles.tableText,
		isHeader ? sharedStyles.textSemibold : undefined,
		{ color: colors.fontSecondaryInfo },
		alignStyles.text
	]);
	const context = { ...textContext, imageSize: IMAGE_SIZE };

	return (
		<View style={[styles.cell, { width }, alignStyles.cell]}>
			<MarkdownContext.Provider value={context}>
				<Inline value={cell.value} />
			</MarkdownContext.Provider>
		</View>
	);
};

const Table = ({ value }: ITableProps): ReactElement => {
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();
	const widths = getTableColumnWidths(value);
	const tableRows = [value.header, ...value.rows.map(row => row.value)];

	const getRowStyle = (rowIndex: number): StyleProp<ViewStyle>[] => [
		styles.row,
		rowIndex === 0 ? [styles.rowBottomBorder, { borderColor: colors.strokeLight }] : undefined,
		rowIndex > 0 && rowIndex % 2 === 0
			? { backgroundColor: transparentize(colors.fontDefault, ROW_STRIPE_TRANSPARENCY) }
			: undefined
	];

	return (
		<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableContent}>
			<View style={styles.tableContainer}>
				{tableRows.map((cells, rowIndex) => (
					<View key={`table-row-${rowIndex}`} style={getRowStyle(rowIndex)}>
						{cells.map((cell, cellIndex) => (
							<Cell key={`table-cell-${cellIndex}`} cell={cell} width={widths[cellIndex] * fontScale} isHeader={rowIndex === 0} />
						))}
					</View>
				))}
			</View>
		</ScrollView>
	);
};

export default Table;
