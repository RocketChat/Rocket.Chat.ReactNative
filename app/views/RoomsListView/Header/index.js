import React from 'react';
import { Text, View, Platform, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import FastImage from 'react-native-fast-image';
import { HeaderBackButton } from 'react-navigation';
import equal from 'deep-equal';

import Avatar from '../../../containers/Avatar';
import Status from '../../../containers/status';
import RocketChat from '../../../lib/rocketchat';
import { STATUS_COLORS } from '../../../constants/colors';
import { setSearch } from '../../../actions/rooms';
import styles from './styles';
import sharedStyles from '../../Styles';
import log from '../../../utils/log';
import I18n from '../../../i18n';

const title = (offline, connecting, authenticating, logged) => {
	if (offline) {
		return `${ I18n.t('Offline') }...`;
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
	connected: state.meteor.connected,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',

	connecting: state.meteor.connecting,
	authenticating: state.login.isFetching,
	offline: !state.meteor.connected,
	logged: !!state.login.token
}), dispatch => ({
	setSearch: searchText => dispatch(setSearch(searchText))
}))

export default class RoomsListHeaderView extends React.Component {
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

	shouldComponentUpdate(nextProps) {
		if (!equal(this.props, nextProps)) {
			return true;
		}
		return false;
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
		return I18n.t(status.charAt(0).toUpperCase() + status.slice(1));
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
			<View
				style={styles.left}
				accessible
				accessibilityLabel={`${ I18n.t('Connected_to') } ${ this.props.baseUrl }. ${ I18n.t('Tap_to_view_servers_list') }.`}
				accessibilityTraits='button'
				testID='rooms-list-view-sidebar'
			>
				<TouchableOpacity
					style={sharedStyles.headerButton}
					onPress={() => this.props.navigation.openDrawer()}
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

		const accessibilityLabel = `${ user.username }, ${ this.getUserStatusLabel() }, ${ I18n.t('tap_to_change_status') }`;
		return (
			<TouchableOpacity
				style={styles.titleContainer}
				onPress={() => this.showModal()}
				accessibilityLabel={accessibilityLabel}
				accessibilityTraits='header'
				testID='rooms-list-view-user'
			>
				<Avatar
					text={user.username}
					size={24}
				>
					<Status style={[styles.status, styles.user_status]} id={user.id} />
				</Avatar>
				<View style={styles.rows}>
					<Text accessible={false} style={styles.title} ellipsizeMode='tail' numberOfLines={1} allowFontScaling={false}>{this.props.user.username}</Text>
					{ t ? <Text accessible={false} style={styles.status_text} ellipsizeMode='tail' numberOfLines={1} allowFontScaling={false}>{t}</Text> : null}
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
						style={sharedStyles.headerButton}
						onPress={() => this.onPressSearchButton()}
						accessibilityLabel={I18n.t('Search')}
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
						style={sharedStyles.headerButton}
						onPress={() => this.createChannel()}
						accessibilityLabel={I18n.t('Create_Channel')}
						accessibilityTraits='button'
						testID='rooms-list-view-create-channel'
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
		const label = text || status;
		return (
			<TouchableOpacity
				style={styles.modalButton}
				onPress={() => this.onPressModalButton(status)}
				testID={`rooms-list-view-user-presence-${ status }`}
			>
				<View style={statusStyle} />
				<Text style={textStyle}>
					{I18n.t(label.charAt(0).toUpperCase() + label.slice(1))}
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
					placeholder={I18n.t('Search')}
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
			<View style={styles.header} testID='rooms-list-view-header'>
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
					testID='rooms-list-view-user-presence-modal'
				>
					<View style={styles.modal}>
						{this.renderModalButton('online')}
						{this.renderModalButton('busy')}
						{this.renderModalButton('away')}
						{this.renderModalButton('offline', 'invisible')}
					</View>
				</Modal>
			</View>
		);
	}
}
