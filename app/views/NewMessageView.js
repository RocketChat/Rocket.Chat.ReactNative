import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, Text, TextInput, Image, TouchableOpacity
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import database, { safeAddListener } from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import debounce from '../utils/debounce';
import sharedStyles from './Styles';
import I18n from '../i18n';
import Touch from '../utils/touch';
import { isIOS } from '../utils/deviceInfo';
import SearchBox from '../containers/SearchBox';
import { CustomIcon } from '../lib/Icons';
import { CloseModalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { COLOR_PRIMARY, COLOR_WHITE } from '../constants/colors';

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
		backgroundColor: isIOS ? '#F7F8FA' : '#E1E5E8'
	},
	separator: {
		marginLeft: 60
	},
	createChannelButton: {
		marginVertical: 25
	},
	createChannelContainer: {
		height: 47,
		backgroundColor: COLOR_WHITE,
		flexDirection: 'row',
		alignItems: 'center'
	},
	createChannelIcon: {
		color: COLOR_PRIMARY,
		marginLeft: 18,
		marginRight: 15
	},
	createChannelText: {
		color: COLOR_PRIMARY,
		fontSize: 17,
		...sharedStyles.textRegular
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
			search: []
		};
		safeAddListener(this.data, this.updateState);
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

	renderHeader = () => (
		<View>
			<SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='new-message-view-search' />
			<Touch onPress={this.createChannel} style={styles.createChannelButton} testID='new-message-view-create-channel'>
				<View style={[sharedStyles.separatorVertical, styles.createChannelContainer]}>
					<CustomIcon style={styles.createChannelIcon} size={24} name='plus' />
					<Text style={styles.createChannelText}>{I18n.t('Create_Channel')}</Text>
				</View>
			</Touch>
		</View>
	)

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
				name={item.search ? item.name : item.fname}
				username={item.search ? item.username : item.name}
				onPress={() => this.onPressItem(item)}
				baseUrl={baseUrl}
				testID={`new-message-view-item-${ item.name }`}
				style={style}
				user={user}
			/>
		);
	}

	renderList = () => {
		const { search } = this.state;
		return (
			<FlatList
				data={search.length > 0 ? search : this.data}
				extraData={this.state}
				keyExtractor={item => item._id}
				ListHeaderComponent={this.renderHeader}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				keyboardShouldPersistTaps='always'
			/>
		);
	}

	render = () => (
		<SafeAreaView style={styles.safeAreaView} testID='new-message-view' forceInset={{ bottom: 'never' }}>
			<StatusBar />
			{this.renderList()}
		</SafeAreaView>
	);
}
