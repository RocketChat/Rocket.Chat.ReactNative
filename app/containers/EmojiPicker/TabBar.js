import React from 'react';
import PropTypes from 'prop-types';
import { View, TouchableOpacity, Text } from 'react-native';
import styles from './styles';
import { themes } from '../../constants/colors';

export default class TabBar extends React.Component {
	static propTypes = {
		goToPage: PropTypes.func,
		activeTab: PropTypes.number,
		tabs: PropTypes.array,
		tabEmojiStyle: PropTypes.object,
		theme: PropTypes.string
	}

	shouldComponentUpdate(nextProps) {
		const { activeTab, theme } = this.props;
		if (nextProps.activeTab !== activeTab) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	render() {
		const {
			tabs, goToPage, tabEmojiStyle, activeTab, theme
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
						{activeTab === i ? <View style={[styles.activeTabLine, { backgroundColor: themes[theme].tintColor }]} /> : <View style={styles.tabLine} />}
					</TouchableOpacity>
				))}
			</View>
		);
	}
}
