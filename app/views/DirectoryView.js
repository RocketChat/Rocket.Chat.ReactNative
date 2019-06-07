import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, FlatList, Text
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import sharedStyles from './Styles';
import I18n from '../i18n';
import Touch from '../utils/touch';
import { isIOS } from '../utils/deviceInfo';
import SearchBox from '../containers/SearchBox';
import { CustomIcon } from '../lib/Icons';
import StatusBar from '../containers/StatusBar';
import { COLOR_PRIMARY, COLOR_WHITE } from '../constants/colors';
import RCActivityIndicator from '../containers/ActivityIndicator';
import debounce from '../utils/debounce';
import log from '../utils/log';

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
		backgroundColor: isIOS ? '#F7F8FA' : '#E1E5E8'
	},
	list: {
		flex: 1
	},
	listContainer: {
		paddingBottom: 30
	},
	separator: {
		marginLeft: 60
	},
	toggleDropdownContainer: {
		height: 47,
		backgroundColor: COLOR_WHITE,
		flexDirection: 'row',
		alignItems: 'center'
	},
	toggleDropdownIcon: {
		color: COLOR_PRIMARY,
		marginLeft: 20,
		marginRight: 17
	},
	toggleDropdownText: {
		flex: 1,
		color: COLOR_PRIMARY,
		fontSize: 17,
		...sharedStyles.textRegular
	},
	toggleDropdownArrow: {
		color: '#cbced1',
		marginRight: 15
	}
});

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
}))
export default class DirectoryView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Directory')
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
		this.state = {
			data: [],
			loading: false,
			text: '',
			total: -1
		};
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	const { search } = this.state;
	// 	if (!equal(nextState.search, search)) {
	// 		return true;
	// 	}
	// 	return false;
	// }

	componentDidMount() {
		this.load();
	}

	onSearchChangeText = (text) => {
		this.setState({ text });
	}

	onPressItem = (item) => {
		const { navigation } = this.props;
		const onPressItem = navigation.getParam('onPressItem', () => {});
		onPressItem(item);
	}

	// eslint-disable-next-line react/sort-comp
	load = debounce(async(clear) => {
		if (clear) {
			this.setState({ data: [], total: -1, loading: false });
		}

		const {
			loading, text, total, data: { length }
		} = this.state;
		if (loading || length === total) {
			return;
		}

		this.setState({ loading: true });

		try {
			const { data } = this.state;
			const query = { text, type: 'users', workspace: 'all' };
			const directories = await RocketChat.getDirectory({ query, offset: data.length, count: 50 });
			if (directories.success) {
				this.setState({
					data: [...data, ...directories.result],
					loading: false,
					total: directories.total
				});
			} else {
				this.setState({ loading: false });
			}
		} catch (error) {
			log('err_load_directory', error);
			this.setState({ loading: false });
		}
	}, 200)

	search = () => {
		this.load(true);
	}

	toggleDropdown = () => {}

	renderHeader = () => (
		<React.Fragment>
			<SearchBox
				onChangeText={this.onSearchChangeText}
				onSubmitEditing={this.search}
				testID='federation-view-search'
			/>
			<Touch onPress={this.toggleDropdown} testID='federation-view-create-channel'>
				<View style={[sharedStyles.separatorVertical, styles.toggleDropdownContainer]}>
					<CustomIcon style={styles.toggleDropdownIcon} size={20} name='user' />
					<Text style={styles.toggleDropdownText}>Users</Text>
					<CustomIcon name='arrow-down' size={20} style={styles.toggleDropdownArrow} />
				</View>
			</Touch>
		</React.Fragment>
	)

	renderSeparator = () => <View style={[sharedStyles.separator, styles.separator]} />;

	renderItem = ({ item, index }) => {
		const { data } = this.state;
		const { baseUrl, user } = this.props;
		let style;
		if (index === data.length - 1) {
			style = sharedStyles.separatorBottom;
		}
		return (
			<UserItem
				name={item.name}
				username={item.username}
				rightLabel='open.rocket.chat'
				onPress={() => this.onPressItem(item)}
				baseUrl={baseUrl}
				testID={`federation-view-item-${ item.username }`}
				style={style}
				user={user}
			/>
		);
	}

	renderList = () => {
		const { data, loading } = this.state;
		return (
			<FlatList
				data={data}
				style={styles.list}
				contentContainerStyle={styles.listContainer}
				extraData={this.state}
				keyExtractor={item => item._id}
				ListHeaderComponent={this.renderHeader}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				keyboardShouldPersistTaps='always'
				ListFooterComponent={loading ? <RCActivityIndicator /> : null}
				onEndReached={() => this.load()}
			/>
		);
	}

	render = () => (
		<SafeAreaView style={styles.safeAreaView} testID='directory-view' forceInset={{ bottom: 'never' }}>
			<StatusBar />
			{this.renderList()}
		</SafeAreaView>
	);
}
