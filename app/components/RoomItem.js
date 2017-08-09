import React from 'react';
import PropTypes from 'prop-types';
import { Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	roomItem: {
		lineHeight: 18,
		borderTopWidth: 2,
		borderColor: '#aaa',
		padding: 14
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		onPressItem: PropTypes.func.isRequired,
		title: PropTypes.string.isRequired,
		id: PropTypes.string.isRequired
	}

	_onPress = () => {
		this.props.onPressItem(this.props.id);
	};

	render() {
		return (
			<Text onPress={this._onPress} style={styles.roomItem}>{ this.props.title }</Text>
		);
	}
}
