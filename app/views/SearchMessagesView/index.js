import React from 'react';
import PropTypes from 'prop-types';
import { View, FlatList, Text } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import RCTextInput from '../../containers/TextInput';
import ActivityIndicator from '../../containers/ActivityIndicator';
import styles from './styles';
import Markdown from '../../containers/markdown';
import debounce from '../../utils/debounce';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import log from '../../utils/log';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { CloseModalButton } from '../../containers/HeaderButton';
import database from '../../lib/database';

class SearchMessagesView extends React.Component {
	static navigationOptions = ({ navigation, route }) => {
		const options = {
			title: I18n.t('Search')
		};
		const showCloseModal = route.params?.showCloseModal;
		if (showCloseModal) {
			options.headerLeft = () => <CloseModalButton navigation={navigation} />;
		}
		return options;
	}

	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		customEmojis: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			messages: [],
			searchText: ''
		};
		this.rid = props.route.params?.rid;
		this.encrypted = props.route.params?.encrypted;
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loading, searchText, messages } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextState.searchText !== searchText) {
			return true;
		}
		if (!equal(nextState.messages, messages)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.search?.stop?.();
	}

	// Handle encrypted rooms search messages
	searchMessages = async(searchText) => {
		// If it's a encrypted, room we'll search only on the local stored messages
		if (this.encrypted) {
			const db = database.active;
			const messagesCollection = db.collections.get('messages');
			return messagesCollection
				.query(
					// Messages of this room
					Q.where('rid', this.rid),
					// Message content is like the search text
					Q.where('msg', Q.like(`%${ Q.sanitizeLikeString(searchText) }%`))
				)
				.fetch();
		}
		// If it's not a encrypted room, search messages on the server
		const result = await RocketChat.searchMessages(this.rid, searchText);
		if (result.success) {
			return result.messages;
		}
	}

	search = debounce(async(searchText) => {
		this.setState({ searchText, loading: true, messages: [] });

		try {
			const messages = await this.searchMessages(searchText);
			this.setState({
				messages: messages || [],
				loading: false
			});
		} catch (e) {
			this.setState({ loading: false });
			log(e);
		}
	}, 1000)

	getCustomEmoji = (name) => {
		const { customEmojis } = this.props;
		const emoji = customEmojis[name];
		if (emoji) {
			return emoji;
		}
		return null;
	}

	navToRoomInfo = (navParam) => {
		const { navigation, user } = this.props;
		if (navParam.rid === user.id) {
			return;
		}
		navigation.navigate('RoomInfoView', navParam);
	}

	renderEmpty = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={[styles.noDataFound, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>
			</View>
		);
	}

	renderItem = ({ item }) => {
		const { user, baseUrl, theme } = this.props;
		return (
			<Message
				item={item}
				baseUrl={baseUrl}
				user={user}
				timeFormat='MMM Do YYYY, h:mm:ss a'
				isHeader
				showAttachment={() => {}}
				getCustomEmoji={this.getCustomEmoji}
				navToRoomInfo={this.navToRoomInfo}
				theme={theme}
			/>
		);
	}

	renderList = () => {
		const { messages, loading, searchText } = this.state;
		const { theme } = this.props;

		if (!loading && messages.length === 0 && searchText.length) {
			return this.renderEmpty();
		}

		return (
			<FlatList
				data={messages}
				renderItem={this.renderItem}
				style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				keyExtractor={item => item._id}
				onEndReached={this.load}
				ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
				{...scrollPersistTaps}
			/>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='search-messages-view' theme={theme}>
				<StatusBar theme={theme} />
				<View style={styles.searchContainer}>
					<RCTextInput
						autoFocus
						label={I18n.t('Search')}
						onChangeText={this.search}
						placeholder={I18n.t('Search_Messages')}
						testID='search-message-view-input'
						theme={theme}
					/>
					<Markdown msg={I18n.t('You_can_search_using_RegExp_eg')} username='' baseUrl='' theme={theme} />
					<View style={[styles.divider, { backgroundColor: themes[theme].separatorColor }]} />
				</View>
				{this.renderList()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	customEmojis: state.customEmojis
});

export default connect(mapStateToProps)(withTheme(SearchMessagesView));
