import React from 'react';
import { Text, View, Platform, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import { HeaderBackButton } from 'react-navigation';

import Avatar from '../../../containers/Avatar';
import Status from '../../../containers/status';
import RocketChat from '../../../lib/rocketchat';
import { STATUS_COLORS } from '../../../constants/colors';
import { setSearch } from '../../../actions/rooms';
import styles from './styles';
import log from '../../../utils/log';

const title = (offline, connecting, authenticating, logged) => {
	if (offline) {
		return 'offline...';
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
	connected: state.meteor.connected,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',

	connecting: state.meteor.connecting,
	authenticating: state.login.isFetching,
	offline: !state.meteor.connected,
	logged: !!state.login.token
}), dispatch => ({
	setSearch: searchText => dispatch(setSearch(searchText))
}))

export default class RoomsListHeaderView extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		connected: PropTypes.bool,
		baseUrl: PropTypes.string,
		setSearch: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			isModalVisible: false,
			searching: false
		};
	}

	onPressModalButton(status) {
		try {
			RocketChat.setUserPresenceDefaultStatus(status);
		} catch (e) {
			log('onPressModalButton', e);
		}
		this.hideModal();
	}

	onSearchChangeText(text) {
		this.props.setSearch(text.trim());
	}

	onPressCancelSearchButton() {
		this.setState({ searching: false });
		this.props.setSearch('');
	}

	onPressSearchButton() {
		this.setState({ searching: true });
		requestAnimationFrame(() => {
			this.inputSearch.focus();
		});
	}

	getUserStatus() {
		return (this.props.connected && this.props.user.status) || 'offline';
	}

	getUserStatusLabel() {
		const status = this.getUserStatus();
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	showModal() {
		this.setState({ isModalVisible: true });
	}

	hideModal() {
		this.setState({ isModalVisible: false });
	}

	createChannel() {
		this.props.navigation.navigate({
			key: 'SelectedUsers',
			routeName: 'SelectedUsers',
			params: { nextAction: () => this.props.navigation.navigate('CreateChannel') }
		});
	}

	renderLeft() {
		if (this.state.searching) {
			return null;
		}

		return (
			<View style={styles.left} accessible accessibilityLabel="Server's list" accessibilityTraits='button'>
				<TouchableOpacity
					style={styles.headerButton}
					onPress={() => this.props.navigation.navigate({ key: 'DrawerOpen', routeName: 'DrawerOpen' })}
				>
					<FastImage
						style={styles.serverImage}
						source={{ uri: encodeURI(`${ this.props.baseUrl }/assets/favicon_32.png`) }}
					/>
				</TouchableOpacity>
			</View>
		);
	}

	renderCenter() {
		const {
			offline, connecting, authenticating, logged, user
		} = this.props;

		if (this.state.searching) {
			return null;
		}

		if (!user.username) {
			return null;
		}

		const t = title(offline, connecting, authenticating, logged);

		const accessibilityLabel = `${ user.username }, ${ this.getUserStatusLabel() }, double tap to change status`;
		return (

			<TouchableOpacity style={styles.titleContainer} onPress={() => this.showModal()} accessibilityLabel={accessibilityLabel} accessibilityTraits='header'>
				<Avatar
					text={user.username}
					size={24}
				>
					<Status style={[styles.status, styles.user_status]} id={user.id} />
				</Avatar>
				<View style={styles.rows}>
					<Text accessible={false} style={styles.title} ellipsizeMode='tail' numberOfLines={1} allowFontScaling={false}>{this.props.user.username}</Text>
					{ t && <Text accessible={false} style={styles.status_text} ellipsizeMode='tail' numberOfLines={1} allowFontScaling={false}>{t}</Text>}
				</View>
			</TouchableOpacity>
		);
	}

	renderRight() {
		if (this.state.searching) {
			return null;
		}

		return (
			<View style={styles.right}>
				{Platform.OS === 'android' ?
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() => this.onPressSearchButton()}
						accessibilityLabel='Search'
						accessibilityTraits='button'
					>
						<Icon
							name='md-search'
							color='#292E35'
							size={24}
							backgroundColor='transparent'
						/>
					</TouchableOpacity> : null}
				{Platform.OS === 'ios' ?
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() => this.createChannel()}
						accessibilityLabel='Create channel'
						accessibilityTraits='button'
					>
						<Icon
							name='ios-add'
							color='#292E35'
							size={24}
							backgroundColor='transparent'
						/>
					</TouchableOpacity> : null
				}
			</View>
		);
	}

	renderModalButton = (status, text) => {
		const statusStyle = [styles.status, { marginRight: 10, backgroundColor: STATUS_COLORS[status] }];
		const textStyle = { flex: 1, fontWeight: this.props.user.status === status ? 'bold' : 'normal' };
		return (
			<TouchableOpacity
				style={styles.modalButton}
				onPress={() => this.onPressModalButton(status)}
			>
				<View style={statusStyle} />
				<Text style={textStyle}>
					{text || status.charAt(0).toUpperCase() + status.slice(1)}
				</Text>
			</TouchableOpacity>
		);
	};

	renderSearch() {
		if (!this.state.searching) {
			return null;
		}
		return (
			<View style={styles.header}>
				<View style={styles.left}>
					<HeaderBackButton onPress={() => this.onPressCancelSearchButton()} />
				</View>
				<TextInput
					ref={inputSearch => this.inputSearch = inputSearch}
					underlineColorAndroid='transparent'
					style={styles.inputSearch}
					onChangeText={text => this.onSearchChangeText(text)}
					returnKeyType='search'
					placeholder='Search'
					clearButtonMode='while-editing'
					blurOnSubmit
					autoCorrect={false}
					autoCapitalize='none'
				/>
			</View>
		);
	}

	render() {
		return (
			<View style={styles.header}>
				{this.renderLeft()}
				{this.renderCenter()}
				{this.renderRight()}
				{this.renderSearch()}
				<Modal
					isVisible={this.state.isModalVisible}
					supportedOrientations={['portrait', 'landscape']}
					style={{ alignItems: 'center' }}
					onModalHide={() => this.hideModal()}
					onBackdropPress={() => this.hideModal()}
				>
					<View style={styles.modal}>
						{this.renderModalButton('online')}
						{this.renderModalButton('busy')}
						{this.renderModalButton('away')}
						{this.renderModalButton('offline', 'Invisible')}
					</View>
				</Modal>
			</View>
		);
	}
}
