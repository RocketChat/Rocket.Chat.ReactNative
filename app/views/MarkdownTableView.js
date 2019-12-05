import React from 'react';
import { ScrollView } from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../i18n';
import { isIOS } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';

class MarkdownTableView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		...themedHeader(screenProps.theme),
		title: I18n.t('Table')
	});

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	render() {
		const { navigation, theme } = this.props;
		const renderRows = navigation.getParam('renderRows');
		const tableWidth = navigation.getParam('tableWidth');

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
