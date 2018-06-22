import React from 'react';
import { Text, View, TouchableOpacity, TextInput, LayoutAnimation } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import { HeaderBackButton } from 'react-navigation';
import equal from 'deep-equal';

import Avatar from '../../../containers/Avatar';
import Status from '../../../containers/status';
import RocketChat from '../../../lib/rocketchat';
import { STATUS_COLORS } from '../../../constants/colors';
import { setSearch } from '../../../actions/rooms';
import styles from './styles';
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

class RoomsListHeaderView extends React.Component {
	static propTypes = {
		user: PropTypes.object.isRequired,
		connected: PropTypes.bool,
		setSearch: PropTypes.func,
		offline: PropTypes.bool,
		connecting: PropTypes.bool,
		authenticating: PropTypes.bool,
		logged: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.state = {
			isModalVisible: false,
			searching: false
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!equal(this.props, nextProps)) {
			return true;
		}
		if (!equal(this.state, nextState)) {
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
		requestAnimationFrame(() => {
			LayoutAnimation.easeInEaseOut();
			this.setState({ searching: false });
			this.props.setSearch('');
		});
	}

	onPressSearchButton() {
		requestAnimationFrame(() => {
			LayoutAnimation.easeInEaseOut();
			this.setState({ searching: true });
			if (this.inputSearch) {
				this.inputSearch.focus();
			}
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
				// style={styles.titleContainer}
				style={{
					flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
				}} // TODO: refactor
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
				{this.renderCenter()}
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

const mapStateToProps = state => ({
	user: state.login.user,
	connected: state.meteor.connected,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',

	connecting: state.meteor.connecting,
	authenticating: state.login.isFetching,
	offline: !state.meteor.connected,
	logged: !!state.login.token
});

const mapDispatchToProps = dispatch => ({
	setSearch: searchText => dispatch(setSearch(searchText))
});

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(RoomsListHeaderView);
