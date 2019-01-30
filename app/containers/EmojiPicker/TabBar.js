import React from 'react';
import PropTypes from 'prop-types';
import { View, TouchableOpacity, Text } from 'react-native';
import styles from './styles';

export default class TabBar extends React.Component {
	static propTypes = {
		goToPage: PropTypes.func,
		activeTab: PropTypes.number,
		tabs: PropTypes.array,
		tabEmojiStyle: PropTypes.object
	}

	shouldComponentUpdate(nextProps) {
		const { activeTab } = this.props;
		if (nextProps.activeTab !== activeTab) {
			return true;
		}
		return false;
	}

	render() {
		const {
			tabs, goToPage, tabEmojiStyle, activeTab
		} = this.props;

		return (
			<View style={styles.tabsContainer}>
				{tabs.map((tab, i) => (
					<TouchableOpacity
						activeOpacity={0.7}
						key={tab}
						onPress={() => goToPage(i)}
						style={styles.tab}
						testID={`reaction-picker-${ tab }`}
					>
						<Text style={[styles.tabEmoji, tabEmojiStyle]}>{tab}</Text>
						{activeTab === i ? <View style={styles.activeTabLine} /> : <View style={styles.tabLine} />}
					</TouchableOpacity>
				))}
			</View>
		);
	}
}
