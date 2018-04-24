import React from 'react';
import PropTypes from 'prop-types';
import { View, FlatList } from 'react-native';
import { connect } from 'react-redux';

import LoggedView from '../View';
import RCTextInput from '../../containers/TextInput';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import styles from './styles';
import Markdown from '../../containers/message/Markdown';
import debounce from '../../utils/debounce';
import RocketChat from '../../lib/rocketchat';
import buildMessage from '../../lib/methods/helpers/buildMessage';
import Message from '../../containers/message';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

@connect(state => ({
	user: state.login.user,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}))
export default class SearchMessagesView extends LoggedView {
	static propTypes = {
		navigation: PropTypes.object
	};

	constructor(props) {
		super('SearchMessagesView', props);
		this.limit = 0;
		this.state = {
			search: '',
			messages: [],
			searching: false,
			loadingMore: false
		};
	}

	componentDidMount() {
		this.name.focus();
	}

	componentWillUnmount() {
		this.onChangeSearch.stop();
	}

	search = async() => {
		if (this._cancel) {
			this._cancel('cancel');
		}
		const cancel = new Promise((r, reject) => this._cancel = reject);
		let messages = [];
		try {
			const result = await Promise.race([RocketChat.messageSearch(this.searchText, this.props.navigation.state.params.rid, this.limit), cancel]);
			messages = result.messages.map(message => buildMessage(message));
			this.setState({ messages, searching: false, loadingMore: false });
		} catch (error) {
			this._cancel = null;
			if (error !== 'cancel') {
				return this.setState({ searching: false, loadingMore: false });
			}
			console.warn('search', error);
		}
	}

	onChangeSearch = debounce((search) => {
		this.searchText = search;
		this.limit = 0;
		if (!this.state.searching) {
			this.setState({ searching: true });
		}
		this.search();
	}, 1000)

	moreData = () => {
		const { loadingMore, messages } = this.state;
		if (messages.length < this.limit) {
			return;
		}
		if (this.searchText && !loadingMore) {
			this.setState({ loadingMore: true });
			this.limit += 20;
			this.search();
		}
	}

	renderItem = ({ item }) => (
		<Message
			item={item}
			style={styles.message}
			reactions={item.reactions}
			user={this.props.user}
			baseUrl={this.props.baseUrl}
			customTimeFormat='MMMM Do YYYY, h:mm:ss a'
			onLongPress={() => {}}
			onReactionPress={async(emoji) => {
				await RocketChat.setReaction(emoji, item._id);
				this.search();
				this.forceUpdate();
			}}
		/>
	);

	render() {
		const { searching, loadingMore } = this.state;
		return (
			<View
				style={styles.container}
			>
				<View style={styles.searchContainer}>
					<RCTextInput
						inputRef={(e) => { this.name = e; }}
						label='Search'
						onChangeText={this.onChangeSearch}
						placeholder='Search Messages'
					/>
					<Markdown msg='You can search using RegExp. e.g. `/^text$/i`' />
					<View style={styles.divider} />
				</View>
				<FlatList
					data={this.state.messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					onEndReached={this.moreData}
					ListHeaderComponent={searching && <RCActivityIndicator />}
					ListFooterComponent={loadingMore && <RCActivityIndicator />}
					{...scrollPersistTaps}
				/>
			</View>
		);
	}
}
