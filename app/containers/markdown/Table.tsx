import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { CELL_WIDTH } from './TableCell';
import Navigation from '../../lib/navigation/appNavigation';
import styles from './styles';
import I18n from '../../i18n';
import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';
import { useAppSelector } from '../../lib/hooks';

interface ITable {
	children: React.ReactElement | null;
	numColumns: number;
	theme: TSupportedThemes;
}

const MAX_HEIGHT = 300;

const Table = React.memo(({ children, numColumns, theme }: ITable) => {
	const getTableWidth = () => numColumns * CELL_WIDTH;
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const renderRows = (drawExtraBorders = true) => {
		const tableStyle: ViewStyle[] = [styles.table, { borderColor: themes[theme].strokeLight }];
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
		<TouchableOpacity onPress={onPress}>
			<ScrollView
				contentContainerStyle={{ width: getTableWidth() }}
				scrollEnabled={false}
				showsVerticalScrollIndicator={false}
				style={[
					styles.containerTable,
					{ maxWidth: getTableWidth(), maxHeight: MAX_HEIGHT, borderColor: themes[theme].strokeLight }
				]}>
				{renderRows(false)}
			</ScrollView>
			<Text style={[styles.textInfo, { color: themes[theme].fontSecondaryInfo }]}>{I18n.t('Full_table')}</Text>
		</TouchableOpacity>
	);
});

export default Table;
