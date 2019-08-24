import React from 'react';
import { ScrollView } from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../i18n';

export default class TableView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Table')
	});

	static propTypes = {
		navigation: PropTypes.object
	}

	render() {
		const { navigation } = this.props;
		const renderRows = navigation.getParam('renderRows');
		const tableWidth = navigation.getParam('tableWidth');

		return (
			<ScrollView contentContainerStyle={{ width: tableWidth }}>
				{renderRows()}
			</ScrollView>
		);
	}
}
