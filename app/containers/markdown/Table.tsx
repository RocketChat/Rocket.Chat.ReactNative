import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { CELL_WIDTH } from './TableCell';
import Navigation from '../../lib/navigation/appNavigation';
import styles from './styles';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../lib/hooks';

interface ITable {
	children: React.ReactElement | null;
	numColumns: number;
	testID: string;
}

const MAX_HEIGHT = 300;

const Table = React.memo(({ children, numColumns, testID }: ITable) => {
	const { colors } = useTheme();

	const getTableWidth = () => numColumns * CELL_WIDTH;
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const renderRows = (drawExtraBorders = true) => {
		const tableStyle: ViewStyle[] = [styles.table, { borderColor: colors.borderColor }];
		if (drawExtraBorders) {
			tableStyle.push(styles.tableExtraBorders);
		}

		const rows: any = React.Children.toArray(children);
		rows[rows.length - 1] = React.cloneElement(rows[rows.length - 1], {
			isLastRow: true
		});

		return <View style={tableStyle}>{rows}</View>;
	};

	const onPress = () => {
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', {
				screen: 'MarkdownTableView',
				params: { renderRows, tableWidth: getTableWidth() }
			});
		} else {
			Navigation.navigate('MarkdownTableView', { renderRows, tableWidth: getTableWidth() });
		}
	};

	return (
		<TouchableOpacity onPress={onPress} testID={`${testID}-table`}>
			<ScrollView
				contentContainerStyle={{ width: getTableWidth() }}
				scrollEnabled={false}
				showsVerticalScrollIndicator={false}
				style={[styles.containerTable, { maxWidth: getTableWidth(), maxHeight: MAX_HEIGHT, borderColor: colors.borderColor }]}>
				{renderRows(false)}
			</ScrollView>
			<Text style={[styles.textInfo, { color: colors.auxiliaryText }]}>{I18n.t('Full_table')}</Text>
		</TouchableOpacity>
	);
});

export default Table;
