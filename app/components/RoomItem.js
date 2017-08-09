import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	number: {
		width: 20,
		lineHeight: 20,
		borderRadius: 5,
		backgroundColor: 'green',
		color: '#fff',
		textAlign: 'center',
		overflow: 'hidden',
		marginRight: 15
	},
	roomItem: {
		lineHeight: 18,
		borderTopWidth: 2,
		borderColor: '#aaa',
		padding: 14,
		flexGrow: 1
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		onPressItem: PropTypes.func.isRequired,
		item: PropTypes.object.isRequired,
		id: PropTypes.string.isRequired
	}

	_onPress = () => {
		this.props.onPressItem(this.props.id);
	};

	renderNumber = (item) => {
		if (item.unread) {
			return (
				<Text style={styles.number}>
					{ item.unread }
				</Text>
			);
		}
	}

	render() {
		return (
			<View style={styles.container}>
				<Text onPress={this._onPress} style={styles.roomItem}>{ this.props.item.name }</Text>
				{this.renderNumber(this.props.item)}
			</View>
		);
	}
}
