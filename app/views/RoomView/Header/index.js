import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Avatar from '../../../containers/Avatar';
import { STATUS_COLORS } from '../../../constants/colors';
import styles from './styles';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';
import I18n from '../../../i18n';

const title = (offline, connecting, authenticating, logged) => {
	if (offline) {
		return `${ I18n.t('You_are_offline') }...`;
	}

	if (connecting) {
		return `${ I18n.t('Connecting') }...`;
	}

	if (authenticating) {
		return `${ I18n.t('Authenticating') }...`;
	}

	if (logged) {
		return null;
	}

	return `${ I18n.t('Not_logged') }...`;
};

class RoomHeaderView extends React.PureComponent {
	static propTypes = {
		user: PropTypes.object.isRequired,
		activeUsers: PropTypes.object,
		offline: PropTypes.bool,
		connecting: PropTypes.bool,
		authenticating: PropTypes.bool,
		logged: PropTypes.bool,
		loading: PropTypes.bool,
		room_rid: PropTypes.string,
		room_name: PropTypes.string,
		room_t: PropTypes.string,
		room_topic: PropTypes.string
	}

	getUserStatus() {
		if (!this.props.room_rid) {
			return 'offline';
		}
		const userId = this.props.room_rid.replace(this.props.user.id, '').trim();
		const userInfo = this.props.activeUsers[userId];
		return (userInfo && userInfo.status) || 'offline';
	}

	getUserStatusLabel() {
		const status = this.getUserStatus();
		return I18n.t(status.charAt(0).toUpperCase() + status.slice(1));
	}

	isDirect = () => this.props.room_t === 'd';

	render() {
		if (!this.props.room_name) {
			return <View style={styles.titleContainer} />;
		}

		let accessibilityLabel = this.props.room_name;

		if (this.isDirect()) {
			accessibilityLabel += `, ${ this.getUserStatusLabel() }`;
		}
		const {
			offline, connecting, authenticating, logged, loading
		} = this.props;

		let t = '';
		if (!title(offline, connecting, authenticating, logged) && loading) {
			t = I18n.t('Loading_messages_ellipsis');
		} else if (this.isDirect()) {
			t = this.getUserStatusLabel();
		} else {
			t = this.props.room_topic || ' ';
		}

		return (
			<View
				style={styles.header}
				testID='room-view-header'
				accessibilityLabel={accessibilityLabel}
			>
				<Avatar
					text={this.props.room_name}
					size={24}
					style={styles.avatar}
					type={this.props.room_t}
				>
					{this.isDirect() ?
						<View style={[styles.status, { backgroundColor: STATUS_COLORS[this.getUserStatus()] }]} />
						: null
					}
				</Avatar>
				<View style={styles.titleTextContainer}>
					<View style={{ flexDirection: 'row' }}>
						<RoomTypeIcon type={this.props.room_t} size={13} />
						<Text style={styles.title} allowFontScaling={false} testID='room-view-title'>
							{this.props.room_name}
						</Text>
					</View>

					{ t ? <Text style={styles.userStatus} allowFontScaling={false} numberOfLines={1}>{t}</Text> : null}

				</View>
			</View>
		);
	}
}

const mapStateToProps = state => ({
	user: state.login.user,
	activeUsers: state.activeUsers,
	loading: state.messages.isFetching,
	connecting: state.meteor.connecting,
	authenticating: state.login.isFetching,
	offline: !state.meteor.connected,
	logged: !!state.login.token,
	room_rid: state.room.rid,
	room_name: state.room.name,
	room_t: state.room.t,
	room_topic: state.room.topic
});

export default connect(mapStateToProps, null, null, { withRef: true })(RoomHeaderView);
