import React from 'react';
import moment from 'moment';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Avatar from '../containers/Avatar';
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
	roomNameView: {
		flex: 1,
		marginLeft: 16,
		marginRight: 4
	},
	roomName: {
		paddingTop: 10,
		flex: 1,
		fontSize: 16,
		height: 16,
		color: '#444'
	},
	update: {
		flex: 1,
		fontSize: 10,
		height: 10,
		color: '#888'
	},
	iconContainer: {
		height: 40,
		width: 40,
		borderRadius: 4,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center'
	},
	icon: {
		fontSize: 20,
		color: '#fff'
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
		_updatedAt: PropTypes.instanceOf(Date),
		unread: PropTypes.number,
		baseUrl: PropTypes.string,
		onPress: PropTypes.func,
		dateFormat: PropTypes.string
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

		if (type === 'd') {
			return (
				<Avatar text={name} baseUrl={baseUrl} size={40} />
			);
		}
		const { color } = avatarInitialsAndColor(name);

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
		const { unread, name, _updatedAt } = this.props;

		return (
			<TouchableOpacity onPress={this.props.onPress} style={styles.container}>
				{this.icon}
				<View style={styles.roomNameView}>
					<Text style={styles.roomName} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
					{_updatedAt ? <Text style={styles.update} ellipsizeMode='tail' numberOfLines={1}>{ moment(_updatedAt).format(this.props.dateFormat) }</Text> : null}
				</View>
				{this.renderNumber(unread)}
			</TouchableOpacity>
		);
	}
}
