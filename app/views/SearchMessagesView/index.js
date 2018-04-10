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

	search = async() => {
		let messages = [];
		try {
			const result = await RocketChat.messageSearch(this.state.search, this.props.navigation.state.params.rid, this.limit);
			if (result.messages.length > 0) {
				messages = result.messages.map(message => buildMessage(message));
			}
			this.setState({ messages, searching: false, loadingMore: false });
		} catch (error) {
			alert(error);
		}
	}

	onChangeSearch = (search) => {
		this.limit = 0;
		this.setState({ search, searching: true });
		this.search();
	}

	moreData = () => {
		const { search, loadingMore, messages } = this.state;
		if (messages.length < this.limit) {
			return;
		}
		if (search && !loadingMore) {
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
			Message_TimeFormat='MMMM Do YYYY, h:mm:ss a'
			onLongPress={() => {}}
			onReactionPress={async(emoji) => {
				await RocketChat.setReaction(emoji, item._id);
				this.search();
				this.forceUpdate();
			}}
		/>
	);

	render() {
		const { search, searching, loadingMore } = this.state;
		return (
			<View
				style={styles.container}
			>
				<View style={styles.searchContainer}>
					<RCTextInput
						inputRef={(e) => { this.name = e; }}
						label='Search'
						value={search}
						onChangeText={debounce(text => this.onChangeSearch(text), 500)}
						placeholder='Search Messages'
					/>
					<Markdown msg='You can search using RegExp. e.g. `/^text$/i`' />
					<View style={styles.divider} />
				</View>
				<FlatList
					data={this.state.messages}
					extraData={this.state.messages}
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
