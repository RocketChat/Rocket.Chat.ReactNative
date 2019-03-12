import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, LayoutAnimation
} from 'react-native';
import { connect } from 'react-redux';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import I18n from '../../../i18n';
import { STATUS_COLORS } from '../../../constants/colors';
import sharedStyles from '../../Styles';
import { isIOS } from '../../../utils/deviceInfo';
import { CustomIcon } from '../../../lib/Icons';
import Status from '../../../containers/Status/Status';

const TITLE_SIZE = 18;
const ICON_SIZE = 18;
const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	title: {
		...sharedStyles.textSemibold,
		color: isIOS ? '#0C0D0F' : '#fff',
		fontSize: TITLE_SIZE
	},
	type: {
		width: ICON_SIZE,
		height: ICON_SIZE,
		marginRight: 8,
		color: isIOS ? '#9EA2A8' : '#fff'
	},
	typing: {
		...sharedStyles.textRegular,
		color: isIOS ? '#9EA2A8' : '#fff',
		fontSize: 12
	},
	typingUsers: {
		...sharedStyles.textSemibold,
		fontWeight: '600'
	},
	status: {
		marginRight: 8
	}
});

@responsive
@connect((state) => {
	let status = '';
	let title = '';
	const roomType = state.room.t;
	if (roomType === 'd') {
		if (state.login.user && state.login.user.id) {
			const { id: loggedUserId } = state.login.user;
			const userId = state.room.rid.replace(loggedUserId, '').trim();
			if (userId === loggedUserId) {
				status = state.login.user.status; // eslint-disable-line
			} else {
				const user = state.activeUsers[userId];
				status = (user && user.status) || 'offline';
			}
		}
		title = state.settings.UI_Use_Real_Name ? state.room.fname : state.room.name;
	} else {
		title = state.room.name;
	}

	let otherUsersTyping = [];
	if (state.login.user && state.login.user.username) {
		const { username } = state.login.user;
		const { usersTyping } = state.room;
		otherUsersTyping = usersTyping.filter(_username => _username !== username);
	}

	return {
		usersTyping: otherUsersTyping,
		type: roomType,
		title,
		status
	};
})
export default class RoomHeaderView extends Component {
	static propTypes = {
		title: PropTypes.string,
		type: PropTypes.string,
		window: PropTypes.object,
		usersTyping: PropTypes.array,
		status: PropTypes.string
	};

	shouldComponentUpdate(nextProps) {
		const {
			type, title, status, usersTyping, window
		} = this.props;
		if (nextProps.type !== type) {
			return true;
		}
		if (nextProps.title !== title) {
			return true;
		}
		if (nextProps.status !== status) {
			return true;
		}
		if (nextProps.window.width !== window.width) {
			return true;
		}
		if (nextProps.window.height !== window.height) {
			return true;
		}
		if (!equal(nextProps.usersTyping, usersTyping)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		if (isIOS) {
			const { usersTyping } = this.props;
			if (!equal(prevProps.usersTyping, usersTyping)) {
				LayoutAnimation.easeInEaseOut();
			}
		}
	}

	get typing() {
		const { usersTyping } = this.props;
		let usersText;
		if (!usersTyping.length) {
			return null;
		} else if (usersTyping.length === 2) {
			usersText = usersTyping.join(` ${ I18n.t('and') } `);
		} else {
			usersText = usersTyping.join(', ');
		}
		return (
			<Text style={styles.typing} numberOfLines={1}>
				<Text style={styles.typingUsers}>{usersText} </Text>
				{ usersTyping.length > 1 ? I18n.t('are_typing') : I18n.t('is_typing') }...
			</Text>
		);
	}

	renderIcon = () => {
		const { type, status } = this.props;
		if (type === 'd') {
			return <Status size={10} style={styles.status} status={status} />;
		}

		const icon = type === 'c' ? 'hashtag' : 'lock';
		return (
			<CustomIcon
				name={icon}
				size={ICON_SIZE * 1}
				style={[
					styles.type,
					{
						width: ICON_SIZE * 1,
						height: ICON_SIZE * 1
					},
					type === 'd' && { color: STATUS_COLORS[status] }
				]}
			/>
		);
	}

	render() {
		const {
			window, title, usersTyping
		} = this.props;
		const portrait = window.height > window.width;
		let scale = 1;

		if (!portrait) {
			if (usersTyping.length > 0) {
				scale = 0.8;
			}
		}

		return (
			<View style={styles.container}>
				<View style={styles.titleContainer}>
					{this.renderIcon()}
					<Text style={[styles.title, { fontSize: TITLE_SIZE * scale }]} numberOfLines={1}>{title}</Text>
				</View>
				{this.typing}
			</View>
		);
	}
}
