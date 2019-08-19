import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList, Text
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import RocketChat from '../../lib/rocketchat';
import DirectoryItem from '../../presentation/DirectoryItem';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import Touch from '../../utils/touch';
import SearchBox from '../../containers/SearchBox';
import { CustomIcon } from '../../lib/Icons';
import StatusBar from '../../containers/StatusBar';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import debounce from '../../utils/debounce';
import log from '../../utils/log';
import Options from './Options';
import styles from './styles';

class DirectoryView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Directory')
	})

	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		isFederationEnabled: PropTypes.bool,
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
			total: -1,
			showOptionsDropdown: false,
			globalUsers: true,
			type: 'channels'
		};
	}

	componentDidMount() {
		this.load({});
	}

	onSearchChangeText = (text) => {
		this.setState({ text });
	}

	onPressItem = (item) => {
		const { navigation } = this.props;
		try {
			const onPressItem = navigation.getParam('onPressItem', () => {});
			onPressItem(item);
		} catch (error) {
			console.log('DirectoryView -> onPressItem -> error', error);
		}
	}

	// eslint-disable-next-line react/sort-comp
	load = debounce(async({ newSearch = false }) => {
		if (newSearch) {
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
			const { data, type, globalUsers } = this.state;
			const query = { text, type, workspace: globalUsers ? 'all' : 'local' };
			const directories = await RocketChat.getDirectory({
				query,
				offset: data.length,
				count: 50,
				sort: (type === 'users') ? { username: 1 } : { usersCount: -1 }
			});
			if (directories.success) {
				this.setState({
					data: [...data, ...directories.result],
					loading: false,
					total: directories.total
				});
			} else {
				this.setState({ loading: false });
			}
		} catch (e) {
			log(e);
			this.setState({ loading: false });
		}
	}, 200)

	search = () => {
		this.load({ newSearch: true });
	}

	changeType = (type) => {
		this.setState({ type, data: [] }, () => this.search());
	}

	toggleWorkspace = () => {
		this.setState(({ globalUsers }) => ({ globalUsers: !globalUsers, data: [] }), () => this.search());
	}

	toggleDropdown = () => {
		this.setState(({ showOptionsDropdown }) => ({ showOptionsDropdown: !showOptionsDropdown }));
	}

	goRoom = async({ rid, name, t }) => {
		const { navigation } = this.props;
		await navigation.navigate('RoomsListView');
		navigation.navigate('RoomView', { rid, name, t });
	}

	onPressItem = async(item) => {
		const { type } = this.state;
		if (type === 'users') {
			const result = await RocketChat.createDirectMessage(item.username);
			if (result.success) {
				this.goRoom({ rid: result.room._id, name: item.username, t: 'd' });
			}
		} else {
			this.goRoom({ rid: item._id, name: item.name, t: 'c' });
		}
	}

	renderHeader = () => {
		const { type } = this.state;
		return (
			<React.Fragment>
				<SearchBox
					onChangeText={this.onSearchChangeText}
					onSubmitEditing={this.search}
					testID='federation-view-search'
				/>
				<Touch onPress={this.toggleDropdown} testID='federation-view-create-channel'>
					<View style={[sharedStyles.separatorVertical, styles.toggleDropdownContainer]}>
						<CustomIcon style={styles.toggleDropdownIcon} size={20} name={type === 'users' ? 'user' : 'hashtag'} />
						<Text style={styles.toggleDropdownText}>{type === 'users' ? I18n.t('Users') : I18n.t('Channels')}</Text>
						<CustomIcon name='arrow-down' size={20} style={styles.toggleDropdownArrow} />
					</View>
				</Touch>
			</React.Fragment>
		);
	}

	renderSeparator = () => <View style={[sharedStyles.separator, styles.separator]} />;

	renderItem = ({ item, index }) => {
		const { data, type } = this.state;
		const { baseUrl, user } = this.props;

		let style;
		if (index === data.length - 1) {
			style = sharedStyles.separatorBottom;
		}

		const commonProps = {
			title: item.name,
			onPress: () => this.onPressItem(item),
			baseUrl,
			testID: `federation-view-item-${ item.name }`,
			style,
			user
		};

		if (type === 'users') {
			return (
				<DirectoryItem
					avatar={item.username}
					description={item.username}
					rightLabel={item.federation && item.federation.peer}
					type='d'
					{...commonProps}
				/>
			);
		}
		return (
			<DirectoryItem
				avatar={item.name}
				description={item.topic}
				rightLabel={I18n.t('N_users', { n: item.usersCount })}
				type='c'
				{...commonProps}
			/>
		);
	}

	render = () => {
		const {
			data, loading, showOptionsDropdown, type, globalUsers
		} = this.state;
		const { isFederationEnabled } = this.props;
		return (
			<SafeAreaView style={styles.safeAreaView} testID='directory-view' forceInset={{ vertical: 'never' }}>
				<StatusBar />
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
					onEndReached={() => this.load({})}
				/>
				{showOptionsDropdown
					? (
						<Options
							type={type}
							globalUsers={globalUsers}
							close={this.toggleDropdown}
							changeType={this.changeType}
							toggleWorkspace={this.toggleWorkspace}
							isFederationEnabled={isFederationEnabled}
						/>
					)
					: null}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	},
	isFederationEnabled: state.settings.FEDERATION_Enabled
});

export default connect(mapStateToProps)(DirectoryView);
