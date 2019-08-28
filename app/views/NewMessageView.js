import React from 'react';
import PropTypes from 'prop-types';
import Contacts from 'react-native-contacts';
import {
	View, StyleSheet, FlatList, Text, TextInput, Image, TouchableOpacity, ScrollView
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import { TouchableHighlight } from 'react-native-gesture-handler';

import database, { safeAddListener } from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import debounce from '../utils/debounce';
import sharedStyles from './Styles';
import I18n from '../i18n';
import { isIOS } from '../utils/deviceInfo';
import StatusBar from '../containers/StatusBar';
import { COLOR_WHITE } from '../constants/colors';

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
		backgroundColor: isIOS ? '#F7F8FA' : '#E1E5E8'
	},
	separator: {
		marginLeft: 80
	},
	headerContainer: {
		flexDirection: 'column',
		paddingTop: 55,
		paddingHorizontal: 8,
		height: 142,
		backgroundColor: '#f9f9f9',
		borderBottomWidth: 0.3,
		borderColor: '#b2b2b2'
	},
	headerContainer2: {
		flexDirection: 'row'
	},
	textContainer: {
		flex: 1,
		backgroundColor: COLOR_WHITE,
		justifyContent: 'center'
	},
	headerTitleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	headerTitleText: {
		flex: 1,
		textAlign: 'center',
		fontFamily: 'System',
		fontSize: 17,
		fontWeight: '600'
	},
	backButtonContainer: {
		flex: 1,
		flexDirection: 'row'
	},
	backButtonImage: {
		height: 22,
		width: 18
	},
	backButtonText: {
		fontSize: 17,
		fontWeight: '400',
		color: '#007aff'
	},
	searchContainer: {
		flexDirection: 'row',
		height: 43,
		marginTop: 12,
		alignItems: 'center',
		backgroundColor: '#E6E8E9',
		borderRadius: 10
	},
	searchBar: {
		flex: 1,
		paddingHorizontal: 8,
		height: 28,
		backgroundColor: '#E6E8E9',
		fontSize: 17
	},
	searchBarImage: {
		marginLeft: 10,
		height: 17,
		width: 17
	}
});

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
}))
export default class NewMessageView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		header: (
			<View style={styles.headerContainer}>
				<View style={styles.headerContainer2}>
					<View style={styles.backButtonContainer}>
						<TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.pop()}>
							<Image
								source={require('../../icons/ios-filled-back.png')}
								resizeMode='contain'
								style={styles.backButtonImage}
							/>
							<Text style={styles.backButtonText}>Messages</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.headerTitleContainer}>
						<Text style={styles.headerTitleText}>{I18n.t('New_Message')}</Text>
					</View>
					<View style={{ flex: 1 }} />
				</View>
				<View style={styles.searchContainer}>
					<Image source={require('../../icons/Search.png')} style={styles.searchBarImage} />
					<TextInput style={styles.searchBar} placeholder='Search' placeholderTextColor='#8e8e93' />
				</View>
			</View>
		)
	})

	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	};

	constructor(props) {
		super(props);
		this.data = database.objects('subscriptions').filtered('t = $0', 'd').sorted('roomUpdatedAt', true);
		this.state = {
			search: [],
			syncedContacts: [],
			unsyncedContacts: []
		};
		safeAddListener(this.data, this.updateState);
	}

	async componentDidMount() {
		const [syncedContacts, unsyncedContacts] = await this.syncContacts();
		this.setState({ syncedContacts, unsyncedContacts });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { search } = this.state;
		if (!equal(nextState.search, search)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.updateState.stop();
		this.data.removeAllListeners();
	}

	onSearchChangeText(text) {
		this.search(text);
	}

	syncContacts = async() => {
		const CryptoJS = require('crypto-js');

		let deviceContacts;
		const weakHashes = [];
		const hashedContacts = [];
		let serverResponse;
		const syncedContacts = [];
		const unsyncedContacts = [];

		try {
			deviceContacts = await this.fetchDeviceContacts();
		} catch (error) {
			console.log('error_fetchDeviceContacts', error);
		}

		deviceContacts.forEach((contact) => {
			contact.emailAddresses.forEach((emailAddress) => {
				const _email = emailAddress.email;
				const strongHash = CryptoJS.SHA1(_email).toString(CryptoJS.enc.Hex);
				const weakHash = strongHash.substr(3, 6);
				weakHashes.push(weakHash);
				contact.hash = strongHash;
				hashedContacts.push(Object.assign({}, contact));
			});
			contact.phoneNumbers.forEach((phoneNumber) => {
				const _number = phoneNumber.number;
				const strongHash = CryptoJS.SHA1(_number).toString(CryptoJS.enc.Hex);
				const weakHash = strongHash.substr(3, 6);
				weakHashes.push(weakHash);
				contact.hash = strongHash;
				hashedContacts.push(Object.assign({}, contact));
			});
		});

		try {
			serverResponse = await RocketChat.queryContacts(weakHashes);
		} catch (error) {
			console.log('error_queryContacts', error);
		}

		hashedContacts.forEach((contact) => {
			const foundResponse = serverResponse.find(response => response.h === contact.hash);
			if (foundResponse) {
				contact.username = foundResponse.u;
				syncedContacts.push(contact);
			} else {
				unsyncedContacts.push(contact);
			}
		});

		return [syncedContacts, unsyncedContacts];
	}

	fetchDeviceContacts = () => new Promise((resolve, reject) => Contacts.getAll((err, contacts) => {
		if (err) {
			reject(err);
		} else {
			this.setState(contacts);
			resolve(contacts);
		}
	}))

	onPressItem = (item) => {
		const { navigation } = this.props;
		const onPressItem = navigation.getParam('onPressItem', () => {});
		onPressItem(item);
	}

	dismiss = () => {
		const { navigation } = this.props;
		return navigation.pop();
	}

	// eslint-disable-next-line react/sort-comp
	updateState = debounce(() => {
		this.forceUpdate();
	}, 1000);

	search = async(text) => {
		const result = await RocketChat.search({ text, filterRooms: false });
		this.setState({
			search: result
		});
	}

	createChannel = () => {
		const { navigation } = this.props;
		navigation.navigate('SelectedUsersViewCreateChannel', { nextActionID: 'CREATE_CHANNEL', title: I18n.t('Select_Users') });
	}

	renderGroupChannelButtons = (buttonName, iconName) => {
		let icon;
		if (iconName === 'Lock.png') {
			icon = require('../../icons/Lock.png');
		} else {
			icon = require('../../icons/Hashtag.png');
		}
		return (
			<TouchableHighlight style={{ height: 56, backgroundColor: COLOR_WHITE }}>
				<View style={{ flexDirection: 'row', height: 56, backgroundColor: COLOR_WHITE }}>
					<View style={{ justifyContent: 'center' }}>
						<Image
							source={icon}
							resizeMode='contain'
							style={{ height: 23, width: 23, marginHorizontal: 10 }}
						/>
					</View>
					<View style={styles.textContainer}>
						<Text style={{ fontSize: 17, color: '#007AFF' }}>{buttonName}</Text>
					</View>
					<View style={{ justifyContent: 'center' }}>
						<Image
							source={require('../../icons/Next.png')}
							resizeMode='contain'
							style={{ height: 23, width: 23, marginRight: 10 }}
						/>
					</View>
				</View>
			</TouchableHighlight>
		);
	}

	renderSeparator = () => <View style={[sharedStyles.separator, styles.separator]} />;

	renderItem = ({ item, index }) => {
		const { search } = this.state;
		const { baseUrl, user } = this.props;

		let style = {};
		if (index === 0) {
			style = { ...sharedStyles.separatorTop };
		}
		if (search.length > 0 && index === search.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		if (search.length === 0 && index === this.data.length - 1) {
			style = { ...style, ...sharedStyles.separatorBottom };
		}
		return (
			<UserItem
				name={item.search ? item.name : item.givenName.concat(' ', item.familyName)}
				username={item.search ? item.username : item.username}
				onPress={() => this.onPressItem(item)}
				baseUrl={baseUrl}
				testID={`new-message-view-item-${ item.username }`}
				style={style}
				user={user}
			/>
		);
	}

	renderSyncedContacts = (search, syncedContacts) => (
		<FlatList
			data={search.length > 0 ? search : syncedContacts}
			extraData={this.state}
			keyExtractor={item => item._id}
			renderItem={this.renderItem}
			ItemSeparatorComponent={this.renderSeparator}
			keyboardShouldPersistTaps='always'
		/>
	);

	renderParentList = () => {
		const { search } = this.state;
		const { syncedContacts } = this.state;
		return (
			<ScrollView>
				{this.renderGroupChannelButtons('New Group', 'Lock.png')}
				{this.renderSeparator()}
				{this.renderGroupChannelButtons('New Channel', 'Hashtag.png')}
				{this.renderSyncedContacts(search, syncedContacts)}
			</ScrollView>
		);
	}

	render = () => (
		<SafeAreaView style={styles.safeAreaView} testID='new-message-view' forceInset={{ bottom: 'never' }}>
			<StatusBar />
			{this.renderParentList()}
		</SafeAreaView>
	);
}
