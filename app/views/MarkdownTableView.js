import React from 'react';
import { ScrollView } from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../i18n';
import { isIOS } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';

class MarkdownTableView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Table')
	})

	static propTypes = {
		route: PropTypes.object,
		theme: PropTypes.string
	}

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
				<ScrollView horizontal>
					{renderRows()}
				</ScrollView>
			</ScrollView>
		);
	}
}

export default withTheme(MarkdownTableView);
