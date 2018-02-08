import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';

let platformContainerStyles;
if (Platform.OS === 'ios') {
	platformContainerStyles = {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(0, 0, 0, .3)'
	};
} else {
	platformContainerStyles = {
		shadowColor: 'black',
		shadowOpacity: 0.1,
		shadowRadius: StyleSheet.hairlineWidth,
		shadowOffset: {
			height: StyleSheet.hairlineWidth
		},
		elevation: 4
	};
}

const appBarHeight = Platform.OS === 'ios' ? 44 : 56;
const styles = StyleSheet.create({
	container: {
		backgroundColor: Platform.OS === 'ios' ? '#F7F7F7' : '#FFF',
		height: appBarHeight,
		...platformContainerStyles
	},
	appBar: {
		flex: 1
	}
});

export default class Header extends React.PureComponent {
	static propTypes = {
		subview: PropTypes.object.isRequired
	}

	render() {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.appBar}>
					{this.props.subview}
				</View>
			</SafeAreaView>
		);
	}
}
