import React from 'react';
import { CachedImage } from 'react-native-img-cache';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

import avatarInitialsAndColor from '../utils/avatarInitialsAndColor';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		padding: 10,
		paddingLeft: 14,
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
	iconContainer: {
		marginTop: 5,
		marginRight: 10,
		backgroundColor: '#ccc',
		height: 40,
		width: 40,
		borderRadius: 20,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center'
	},
	icon: {
		fontSize: 20,
		color: '#fff',
		backgroundColor: '#ccc',
		height: 36,
		width: 36,
		borderRadius: 18,
		overflow: 'hidden',
		textAlign: 'center',
		lineHeight: 36
	},
	avatar: {
		width: 40,
		height: 40,
		position: 'absolute'
	},
	avatarInitials: {
		fontSize: 22,
		color: '#ffffff'
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired
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

		if (this.props.item.t === 'd') {
			const { name } = this.props.item;
			const { initials, color } = avatarInitialsAndColor(name);
			return (
				<View style={[styles.iconContainer, { backgroundColor: color }]}>
					<Text style={styles.avatarInitials}>{initials}</Text>
					<CachedImage style={styles.avatar} source={{ uri: `${ this.props.baseUrl }/avatar/${ name }` }} />
				</View>
			);
		}

		return (
			<View style={styles.iconContainer}>
				<MaterialCommunityIcons name={icon} style={styles.icon} />
			</View>
		);
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
		const { name } = this.props.item;
		return (
			<View style={styles.container}>
				{this.icon}
				<Text style={styles.roomItem}>{ name }</Text>
				{this.renderNumber(this.props.item)}
			</View>
		);
	}
}
