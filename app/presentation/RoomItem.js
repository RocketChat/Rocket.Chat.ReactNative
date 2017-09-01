import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Avatar from './avatar';
import avatarInitialsAndColor from '../utils/avatarInitialsAndColor';

const styles = StyleSheet.create({
	container: {
		// flex: 1,
		flexDirection: 'row',
		paddingLeft: 16,
		paddingRight: 16,
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
		paddingLeft: 5,
		paddingRight: 5
	},
	roomName: {
		flex: 1,
		fontSize: 16,
		color: '#444',
		marginLeft: 16,
		marginRight: 4
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
		fontSize: 20,
		color: '#ffffff'
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		unread: PropTypes.number,
		baseUrl: PropTypes.string,
		onPress: PropTypes.func
	}

	get icon() {
		const { type, name, baseUrl } = this.props;

		const icon = {
			d: 'at',
			c: 'pound',
			p: 'lock',
			l: 'account'
		}[type];

		if (!icon) {
			return null;
		}

		const { initials, color } = avatarInitialsAndColor(name);

		if (type === 'd') {
			return (
				<Avatar text={name} baseUrl={baseUrl} size={40} borderRadius={20} />
			);
		}

		return (
			<View style={[styles.iconContainer, { backgroundColor: color }]}>
				<MaterialCommunityIcons name={icon} style={styles.icon} />
			</View>
		);
	}

	renderNumber = (unread) => {
		if (!unread || unread <= 0) {
			return;
		}

		if (unread >= 1000) {
			unread = '999+';
		}

		return (
			<Text style={styles.number}>
				{ unread }
			</Text>
		);
	}

	render() {
		const { unread, name } = this.props;
		return (
			<TouchableOpacity onPress={this.props.onPress} style={styles.container}>
				{this.icon}
				<Text style={styles.roomName} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
				{this.renderNumber(unread)}
			</TouchableOpacity>
		);
	}
}
