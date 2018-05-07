import React from 'react';
import { Text, View, Platform, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { HeaderBackButton } from 'react-navigation';

import RocketChat from '../../../lib/rocketchat';
import realm from '../../../lib/realm';
import Avatar from '../../../containers/Avatar';
import { STATUS_COLORS } from '../../../constants/colors';
import styles from './styles';
import { closeRoom } from '../../../actions/room';

const title = (offline, connecting, authenticating, logged) => {
	if (offline) {
		return 'You are offline...';
	}

	if (connecting) {
		return 'Connecting...';
	}

	if (authenticating) {
		return 'Authenticating...';
	}

	if (logged) {
		return null;
	}

	return 'Not logged...';
};

@connect(state => ({
	user: state.login.user,
	activeUsers: state.activeUsers,
	loading: state.messages.isFetching,
	connecting: state.meteor.connecting,
	authenticating: state.login.isFetching,
	offline: !state.meteor.connected,
	logged: !!state.login.token
}), dispatch => ({
	close: () => dispatch(closeRoom())
}))
export default class RoomHeaderView extends React.PureComponent {
	static propTypes = {
		close: PropTypes.func.isRequired,
		navigation: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		activeUsers: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.state = {
			room: props.navigation.state.params.room
		};
		this.room = realm.objects('subscriptions').filtered('rid = $0', this.state.room.rid);
	}

	componentDidMount() {
		this.updateState();
		this.room.addListener(this.updateState);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.navigation.state.params.room !== this.props.navigation.state.params.room) {
			this.room.removeAllListeners();
			this.room = realm.objects('subscriptions').filtered('rid = $0', nextProps.navigation.state.params.room.rid);
			this.room.addListener(this.updateState);
		}
	}

	componentWillUnmount() {
		this.room.removeAllListeners();
	}

	getUserStatus() {
		const userId = this.state.room.rid.replace(this.props.user.id, '').trim();
		const userInfo = this.props.activeUsers[userId];
		return (userInfo && userInfo.status) || 'offline';
	}

	getUserStatusLabel() {
		const status = this.getUserStatus();
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	updateState = () => {
		if (this.room.length > 0) {
			this.setState({ room: this.room[0] });
		}
	};

	isDirect = () => this.state.room && this.state.room.t === 'd';

	renderLeft = () => (<HeaderBackButton
		onPress={() => {
			this.props.navigation.goBack(null);
			requestAnimationFrame(() => this.props.close());
		}}
		tintColor='#292E35'
		title='Back'
		titleStyle={{ display: 'none' }}
	/>);

	renderCenter() {
		if (!this.state.room.name) {
			return null;
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
			t = 'Loading messages...';
		} else if (this.isDirect()) {
			t = this.getUserStatusLabel();
		} else {
			t = this.state.room.topic || ' ';
		}

		return (
			<TouchableOpacity
				style={styles.titleContainer}
				accessibilityLabel={accessibilityLabel}
				accessibilityTraits='header'
				onPress={() => this.props.navigation.navigate({ key: 'RoomInfo', routeName: 'RoomInfo', params: { rid: this.state.rid } })}
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
					<Text style={styles.title} allowFontScaling={false}>{this.state.room.name}</Text>

					{ t && <Text style={styles.userStatus} allowFontScaling={false} numberOfLines={1}>{t}</Text>}

				</View>
			</TouchableOpacity>
		);
	}

	renderRight = () => (
		<View style={styles.right}>
			<TouchableOpacity
				style={styles.headerButton}
				onPress={() => RocketChat.toggleFavorite(this.state.room.rid, this.state.room.f)}
				accessibilityLabel='Star room'
				accessibilityTraits='button'
			>
				<Icon
					name={`${ Platform.OS === 'ios' ? 'ios' : 'md' }-star${ this.state.room.f ? '' : '-outline' }`}
					color='#f6c502'
					size={24}
					backgroundColor='transparent'
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.headerButton}
				onPress={() => this.props.navigation.navigate({ key: 'RoomActions', routeName: 'RoomActions', params: { rid: this.state.room.rid } })}
				accessibilityLabel='Room actions'
				accessibilityTraits='button'
			>
				<Icon
					name={Platform.OS === 'ios' ? 'ios-more' : 'md-more'}
					color='#292E35'
					size={24}
					backgroundColor='transparent'
				/>
			</TouchableOpacity>
		</View>
	);

	render() {
		return (
			<View style={styles.header}>
				{this.renderLeft()}
				{this.renderCenter()}
				{this.renderRight()}
			</View>
		);
	}
}
