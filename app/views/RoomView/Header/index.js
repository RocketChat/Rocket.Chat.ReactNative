import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import { HeaderBackButton } from 'react-navigation';
import { Navigation } from 'react-native-navigation';

import realm from '../../../lib/realm';
import Avatar from '../../../containers/Avatar';
import { STATUS_COLORS } from '../../../constants/colors';
import styles from './styles';
import { closeRoom } from '../../../actions/room';
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
		roomComponentId: PropTypes.any,
		room: PropTypes.object,
		close: PropTypes.func.isRequired,
		user: PropTypes.object.isRequired,
		activeUsers: PropTypes.object,
		offline: PropTypes.bool,
		connecting: PropTypes.bool,
		authenticating: PropTypes.bool,
		logged: PropTypes.bool,
		loading: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.state = {
			room: props.room
		};
		this.room = realm.objects('subscriptions').filtered('rid = $0', props.room.rid);
	}

	componentDidMount() {
		this.updateState();
		this.room.addListener(this.updateState);
	}

	componentWillUnmount() {
		this.room.removeAllListeners();
		this.props.close();
	}

	getUserStatus() {
		const userId = this.state.room.rid.replace(this.props.user.id, '').trim();
		const userInfo = this.props.activeUsers[userId];
		return (userInfo && userInfo.status) || 'offline';
	}

	getUserStatusLabel() {
		const status = this.getUserStatus();
		return I18n.t(status.charAt(0).toUpperCase() + status.slice(1));
	}

	updateState = () => {
		if (this.room.length > 0) {
			this.setState({ room: this.room[0] });
		}
	};

	isDirect = () => this.state.room && this.state.room.t === 'd';

	goToRoomInfo = () => {
		Navigation.push(this.props.roomComponentId, {
			component: {
				name: 'RoomInfoView',
				passProps: {
					rid: this.state.room.rid
				}
			}
		});
	}

	render() {
		if (!this.state.room.name) {
			return <View style={styles.titleContainer} />;
		}

		let accessibilityLabel = this.state.room.name;

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
			t = this.state.room.topic || ' ';
		}

		return (
			<View style={styles.header} testID='room-view-header'>
				<TouchableOpacity
					style={styles.titleContainer}
					accessibilityLabel={accessibilityLabel}
					accessibilityTraits='header'
					onPress={() => this.goToRoomInfo()}
					testID='room-view-header-title'
				>

					<Avatar
						text={this.state.room.name}
						size={24}
						style={styles.avatar}
						type={this.state.room.t}
					>
						{this.isDirect() ?
							<View style={[styles.status, { backgroundColor: STATUS_COLORS[this.getUserStatus()] }]} />
							: null
						}
					</Avatar>
					<View style={styles.titleTextContainer}>
						<View style={{ flexDirection: 'row' }}>
							<RoomTypeIcon type={this.state.room.t} size={13} />
							<Text style={styles.title} allowFontScaling={false} testID='room-view-title'>
								{this.state.room.name}
							</Text>
						</View>

						{ t ? <Text style={styles.userStatus} allowFontScaling={false} numberOfLines={1}>{t}</Text> : null}

					</View>
				</TouchableOpacity>
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
	logged: !!state.login.token
});

const mapDispatchToProps = dispatch => ({
	close: () => dispatch(closeRoom())
});

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(RoomHeaderView);
