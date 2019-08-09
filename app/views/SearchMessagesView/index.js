import React from 'react';
import PropTypes from 'prop-types';
import { View, FlatList, Text } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import RCTextInput from '../../containers/TextInput';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import styles from './styles';
import Markdown from '../../containers/message/Markdown';
import debounce from '../../utils/debounce';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message/Message';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import log from '../../utils/log';

class SearchMessagesView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Search')
	}

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.object,
		baseUrl: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			messages: [],
			searchText: ''
		};
		this.rid = props.navigation.getParam('rid');
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loading, searchText, messages } = this.state;
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
		this.search.stop();
	}

	// eslint-disable-next-line react/sort-comp
	search = debounce(async(searchText) => {
		this.setState({ searchText, loading: true, messages: [] });

		try {
			const result = await RocketChat.searchMessages(this.rid, searchText);
			if (result.success) {
				this.setState({
					messages: result.messages || [],
					loading: false
				});
			}
		} catch (error) {
			this.setState({ loading: false });
			log('err_search_messages', error);
		}
	}, 1000)

	renderEmpty = () => (
		<View style={styles.listEmptyContainer}>
			<Text style={styles.noDataFound}>{I18n.t('No_results_found')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const { user, baseUrl } = this.props;
		return (
			<Message
				baseUrl={baseUrl}
				user={user}
				author={item.u}
				ts={item.ts}
				msg={item.msg}
				attachments={item.attachments || []}
				timeFormat='MMM Do YYYY, h:mm:ss a'
				isEdited={!!item.editedAt}
				isHeader
				onOpenFileModal={() => {}}
			/>
		);
	}

	renderList = () => {
		const { messages, loading, searchText } = this.state;

		if (!loading && messages.length === 0 && searchText.length) {
			return this.renderEmpty();
		}

		return (
			<FlatList
				data={messages}
				renderItem={this.renderItem}
				style={styles.list}
				keyExtractor={item => item._id}
				onEndReached={this.load}
				ListFooterComponent={loading ? <RCActivityIndicator /> : null}
				{...scrollPersistTaps}
			/>
		);
	}

	render() {
		return (
			<SafeAreaView style={styles.container} testID='search-messages-view' forceInset={{ vertical: 'never' }}>
				<StatusBar />
				<View style={styles.searchContainer}>
					<RCTextInput
						autoFocus
						label={I18n.t('Search')}
						onChangeText={this.search}
						placeholder={I18n.t('Search_Messages')}
						testID='search-message-view-input'
					/>
					<Markdown msg={I18n.t('You_can_search_using_RegExp_eg')} username='' baseUrl='' />
					<View style={styles.divider} />
				</View>
				{this.renderList()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
});

export default connect(mapStateToProps)(SearchMessagesView);
