import React from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
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
		fontSize: 20
	},
	icon: {
		fontSize: 20,
		height: 22,
		width: 22
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired
	}
	get icon() {
		const icon = {
			d: 'at',
			c: 'hashtag',
			p: 'md-lock'
		}[this.props.item.t];
		if (!icon) {
			return null;
		}
		return ['p'].includes(this.props.item.t) ? <Ionicons name={icon} style={styles.icon} /> : <FontAwesome name={icon} style={styles.icon} />;
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
