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
		minWidth: 20,
		fontSize: 14,
		padding: 2,
		borderRadius: 5,
		backgroundColor: '#aaa',
		color: '#fff',
		textAlign: 'center',
		overflow: 'hidden',
		marginRight: 15
	},
	roomItem: {
		lineHeight: 18,
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
		this.props.onPressItem(this.props.id, this.props.item);
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
		let name = this.props.item.name;
		if (this.props.item.t === 'd') {
			name = `@ ${ name }`;
		} else {
			name = `# ${ name }`;
		}
		return (
			<View style={styles.container}>
				<Text onPress={this._onPress} style={styles.roomItem}>{ name }</Text>
				{this.renderNumber(this.props.item)}
			</View>
		);
	}
}
