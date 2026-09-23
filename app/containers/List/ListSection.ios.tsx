import { Children, cloneElement, isValidElement, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '~/theme';
import Header from './ListHeader';
import Separator from './ListSeparator';
import { ICON_SIZE, PADDING_HORIZONTAL } from './constants';

const CARD_MARGIN_HORIZONTAL = 16;

const styles = StyleSheet.create({
	container: {
		marginHorizontal: CARD_MARGIN_HORIZONTAL,
		marginBottom: 28
	},
	card: {
		borderRadius: 10,
		overflow: 'hidden'
	},
	separatorWithIcon: {
		marginLeft: PADDING_HORIZONTAL * 2 + ICON_SIZE
	},
	separatorWithoutIcon: {
		marginLeft: PADDING_HORIZONTAL
	}
});

interface IListSection {
	children: (ReactElement | null)[] | ReactElement | null;
	title?: string;
	translateTitle?: boolean;
}

const isSeparator = (node: unknown): node is ReactElement => isValidElement(node) && node.type === Separator;

const hasLeftIcon = (node: unknown) => isValidElement<{ left?: unknown }>(node) && Boolean(node.props.left);

const insetSeparators = (children: IListSection['children']) => {
	const rows = Children.toArray(children);
	const firstRow = rows.findIndex(row => !isSeparator(row));
	const lastRow = rows.findLastIndex(row => !isSeparator(row));
	return rows.slice(firstRow, lastRow + 1).map((row, index, visibleRows) => {
		if (!isSeparator(row)) {
			return row;
		}
		const style = hasLeftIcon(visibleRows[index + 1]) ? styles.separatorWithIcon : styles.separatorWithoutIcon;
		return cloneElement(row as ReactElement<{ style?: object }>, { style });
	});
};

const ListSection = ({ children, title, translateTitle }: IListSection) => {
	const { colors } = useTheme();
	const rows = insetSeparators(children);

	return (
		<View style={styles.container}>
			{title ? <Header title={title} translateTitle={translateTitle} /> : null}
			{rows.length ? <View style={[styles.card, { backgroundColor: colors.surfaceRoom }]}>{rows}</View> : null}
		</View>
	);
};

ListSection.displayName = 'List.Section';

export default ListSection;
