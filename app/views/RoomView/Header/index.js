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
import log from '../../../utils/log';
import RoomTypeIcon from '../../../containers/RoomTypeIcon';
import I18n from '../../../i18n';
import sharedStyles from '../../Styles';

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
		return I18n.t(status.charAt(0).toUpperCase() + status.slice(1));
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
		title={I18n.t('Back')}
		titleStyle={{ display: 'none' }}
	/>);

	renderCenter() {
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
			<TouchableOpacity
				style={styles.titleContainer}
				accessibilityLabel={accessibilityLabel}
				accessibilityTraits='header'
				onPress={() => this.props.navigation.navigate({ key: 'RoomInfo', routeName: 'RoomInfo', params: { rid: this.state.room.rid } })}
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
		);
	}

	renderRight = () => (
		<View style={styles.right}>
			<TouchableOpacity
				style={sharedStyles.headerButton}
				onPress={() => {
					try {
						RocketChat.toggleFavorite(this.state.room.rid, this.state.room.f);
					} catch (e) {
						log('toggleFavorite', e);
					}
				}}
				accessibilityLabel={I18n.t('Star_room')}
				accessibilityTraits='button'
				testID='room-view-header-star'
			>
				<Icon
					name={`${ Platform.OS === 'ios' ? 'ios' : 'md' }-star${ this.state.room.f ? '' : '-outline' }`}
					color='#f6c502'
					size={24}
					backgroundColor='transparent'
				/>
			</TouchableOpacity>
			<TouchableOpacity
				style={sharedStyles.headerButton}
				onPress={() => this.props.navigation.navigate({ key: 'RoomActions', routeName: 'RoomActions', params: { rid: this.state.room.rid } })}
				accessibilityLabel={I18n.t('Room_actions')}
				accessibilityTraits='button'
				testID='room-view-header-actions'
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
			<View style={styles.header} testID='room-view-header'>
				{this.renderLeft()}
				{this.renderCenter()}
				{this.renderRight()}
			</View>
		);
	}
}
