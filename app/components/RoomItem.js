import React from 'react';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		padding: 24,
		alignItems: 'center'
	},
	number: {
		minWidth: 20,
		padding: 2,
		borderRadius: 5,
		backgroundColor: '#aaa',
		color: '#fff',
		textAlign: 'center',
		overflow: 'hidden',
		marginRight: 15,
		fontSize: 14
	},
	roomItem: {
		flexGrow: 1,
		fontSize: 20,
		color: '#444'
	},
	icon: {
		fontSize: 18,
		marginTop: 5,
		marginRight: 5,
		color: '#aaa'
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired
	}
	get icon() {
		const icon = {
			d: 'at',
			c: 'pound',
			p: 'lock',
			l: 'account'
		}[this.props.item.t];
		if (!icon) {
			return null;
		}
		return <MaterialCommunityIcons name={icon} style={styles.icon} />;
	}
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
		const name = this.props.item.name;
		return (
			<View style={styles.container}>
				{this.icon}
				<Text style={styles.roomItem}>{ name }</Text>
				{this.renderNumber(this.props.item)}
			</View>
		);
	}
}
