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
		paddingLeft: 16,
		paddingRight: 56,
		height: 56,
		alignItems: 'center'
	},
	number: {
		minWidth: 20,
		borderRadius: 5,
		backgroundColor: '#1d74f5',
		color: '#fff',
		textAlign: 'center',
		overflow: 'hidden',
		fontSize: 14,
		right: 16,
		marginLeft: 16,
		position: 'absolute'
	},
	roomName: {
		flexGrow: 1,
		fontSize: 16,
		color: '#444',
		marginLeft: 16
	},
	iconContainer: {
		height: 40,
		width: 40,
		borderRadius: 20,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center'
	},
	icon: {
		fontSize: 20,
		color: '#fff'
	},
	avatar: {
		width: 40,
		height: 40,
		position: 'absolute',
		borderRadius: 20
	},
	avatarInitials: {
		fontSize: 22,
		color: '#ffffff'
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string
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

		const { name } = this.props.item;

		if (this.props.item.t === 'd') {
			const { initials, color } = avatarInitialsAndColor(name);
			return (
				<View style={[styles.iconContainer, { backgroundColor: color }]}>
					<Text style={styles.avatarInitials}>{initials}</Text>
					<CachedImage style={styles.avatar} source={{ uri: `${ this.props.baseUrl }/avatar/${ name }` }} />
				</View>
			);
		}

		const { color } = avatarInitialsAndColor(name);

		return (
			<View style={[styles.iconContainer, { backgroundColor: color }]}>
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
		let extraSpace = {};
		if (this.props.item.unread) {
			extraSpace = { paddingRight: 92 };
		}
		return (
			<View style={[styles.container, extraSpace]}>
				{this.icon}
				<Text style={styles.roomName} ellipsizeMode='tail' numberOfLines={1}>{ this.props.item.name }</Text>
				{this.renderNumber(this.props.item)}
			</View>
		);
	}
}
