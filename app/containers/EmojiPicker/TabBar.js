import React from 'react';
import PropTypes from 'prop-types';
import { View, TouchableOpacity, Text } from 'react-native';
import styles from './styles';

export default class extends React.PureComponent {
	static propTypes = {
		goToPage: PropTypes.func,
		activeTab: PropTypes.number,
		tabs: PropTypes.array
	}

	render() {
		return (
			<View style={styles.tabsContainer}>
				{this.props.tabs.map((tab, i) => (
					<TouchableOpacity activeOpacity={0.7} key={tab} onPress={() => this.props.goToPage(i)} style={styles.tab}>
						<Text style={styles.tabEmoji}>{tab}</Text>
						{this.props.activeTab === i ? <View style={styles.activeTabLine} /> : <View style={styles.tabLine} />}
					</TouchableOpacity>
				))}
			</View>
		);
	}
}
