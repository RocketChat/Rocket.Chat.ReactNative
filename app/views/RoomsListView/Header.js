import React from 'react';
import { Text, View, StyleSheet, Platform, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import { CachedImage } from 'react-native-img-cache';

import Avatar from '../../containers/Avatar';
import RocketChat from '../../lib/rocketchat';
import { STATUS_COLORS } from '../../constants/colors';

const TITLE_OFFSET = Platform.OS === 'ios' ? 70 : 56;

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	titleContainer: {
		left: TITLE_OFFSET,
		right: TITLE_OFFSET,
		position: 'absolute',
		alignItems: 'center',
		justifyContent: Platform.OS === 'ios' ? 'center' : 'flex-start',
		flexDirection: 'row'
	},
	status: {
		borderRadius: 4,
		width: 8,
		height: 8,
		marginRight: 10
	},
	avatar: {
		marginRight: 10
	},
	title: {
		fontWeight: 'normal'
	},
	left: {
		left: 0,
		position: 'absolute'
	},
	right: {
		right: 0,
		position: 'absolute'
	},
	modal: {
		width: width - 60,
		height: width - 60,
		backgroundColor: '#F7F7F7',
		borderRadius: 4,
		flexDirection: 'column'
	},
	modalButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(0, 0, 0, .3)',
		paddingHorizontal: 20
	},
	serverImage: {
		width: 32,
		height: 32,
		padding: 10,
		marginLeft: 10
	}
});

@connect(state => ({
	user: state.login.user,
	baseUrl: state.settings.Site_Url
}))
export default class extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		baseUrl: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			isModalVisible: false
		};
	}

	onPressModalButton(status) {
		RocketChat.setUserPresenceDefaultStatus(status);
		this.hideModal();
	}

	showModal() {
		this.setState({ isModalVisible: true });
	}

	hideModal() {
		this.setState({ isModalVisible: false });
	}

	createChannel() {
		this.props.navigation.navigate('SelectUsers');
	}

	renderLeft() {
		return (
			<View style={styles.left}>
				<TouchableOpacity
					onPress={() => this.props.navigation.navigate('DrawerOpen')}
				>
					<CachedImage
						style={styles.serverImage}
						source={{ uri: encodeURI(`${ this.props.baseUrl }/assets/favicon_32.png`) }}
					/>
				</TouchableOpacity>
			</View>
		);
	}

	renderTitle() {
		if (!this.props.user.username) {
			return null;
		}
		return (
			<TouchableOpacity style={styles.titleContainer} onPress={() => this.showModal()}>
				<View style={[styles.status, { backgroundColor: STATUS_COLORS[this.props.user.status || 'offline'] }]} />
				<Avatar
					text={this.props.user.username}
					size={24}
					style={{ marginRight: 5 }}
					baseUrl={this.props.baseUrl}
				/>
				<Text style={styles.title}>{this.props.user.username}</Text>
			</TouchableOpacity>
		);
	}

	renderRight() {
		if (Platform.OS !== 'ios') {
			return;
		}
		return (
			<View style={styles.right}>
				<Icon.Button
					name='ios-create-outline'
					color='blue'
					size={26}
					backgroundColor='transparent'
					onPress={() => this.createChannel()}
				/>
			</View>
		);
	}

	renderModalButton = (status, text) => {
		const statusStyle = [styles.status, { backgroundColor: STATUS_COLORS[status] }];
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

	render() {
		return (
			<View style={styles.header}>
				{this.renderLeft()}
				{this.renderTitle()}
				{this.renderRight()}
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
