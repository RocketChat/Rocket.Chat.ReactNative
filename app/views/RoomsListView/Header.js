import React from 'react';
import { Text, View, StyleSheet, Platform, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import { CachedImage } from 'react-native-img-cache';

import Avatar from '../../containers/Avatar';
import RocketChat from '../../lib/rocketchat';
import { STATUS_COLORS } from '../../constants/colors';
import { setSearch } from '../../actions/rooms';

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
		flexDirection: 'row',
		height: 44
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
		fontWeight: '500',
		color: '#292E35'
	},
	left: {
		left: 0,
		position: 'absolute'
	},
	right: {
		right: 0,
		position: 'absolute',
		flexDirection: 'row'
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
	headerButton: {
		backgroundColor: 'transparent',
		height: 44,
		width: 44,
		alignItems: 'center',
		justifyContent: 'center'
	},
	serverImage: {
		width: 24,
		height: 24,
		borderRadius: 4
	},
	inputSearch: {
		flex: 1,
		marginLeft: 44
	}
});

@connect(state => ({
	user: state.login.user,
	baseUrl: state.settings.Site_Url
}), dispatch => ({
	setSearch: searchText => dispatch(setSearch(searchText))
}))
export default class extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
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
		RocketChat.setUserPresenceDefaultStatus(status);
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
					style={styles.headerButton}
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
		return (
			<View style={styles.right}>
				{Platform.OS === 'android' ?
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() => this.onPressSearchButton()}
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
					>
						<Icon
							name='ios-add'
							color='#292E35'
							size={24}
							backgroundColor='transparent'
						/>
					</TouchableOpacity> : null}
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

	renderHeader() {
		if (this.state.searching) {
			return null;
		}
		return (
			<View style={styles.header}>
				{this.renderLeft()}
				{this.renderTitle()}
				{this.renderRight()}
			</View>
		);
	}

	renderSearch() {
		if (!this.state.searching) {
			return null;
		}
		return (
			<View style={styles.header}>
				<View style={styles.left}>
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() => this.onPressCancelSearchButton()}
					>
						<Icon
							name='md-arrow-back'
							color='#292E35'
							size={24}
							backgroundColor='transparent'
						/>
					</TouchableOpacity>
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
				/>
			</View>
		);
	}

	render() {
		return (
			<View style={styles.header}>
				{this.renderHeader()}
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
