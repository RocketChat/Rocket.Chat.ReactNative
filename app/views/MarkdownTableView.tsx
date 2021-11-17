import React from 'react';
import { ScrollView } from 'react-native';
import { StackNavigationOptions } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import I18n from '../i18n';
import { isIOS } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';

interface IMarkdownTableViewProps {
	route: RouteProp<
		{ MarkdownTableView: { renderRows: (drawExtraBorders?: boolean) => JSX.Element; tableWidth: number } },
		'MarkdownTableView'
	>;
	theme: string;
}

class MarkdownTableView extends React.Component<IMarkdownTableViewProps> {
	static navigationOptions = (): StackNavigationOptions => ({
		title: I18n.t('Table')
	});

	render() {
		const { route, theme } = this.props;
		const renderRows = route.params?.renderRows;
		const tableWidth = route.params?.tableWidth;

		if (isIOS) {
			return (
				<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }} contentContainerStyle={{ width: tableWidth }}>
					{renderRows()}
				</ScrollView>
			);
		}

		return (
			<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }}>
				<ScrollView horizontal>{renderRows()}</ScrollView>
			</ScrollView>
		);
	}
}

export default withTheme(MarkdownTableView);
