import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Text, View } from 'react-native';
import { connect } from 'react-redux';

import { openSnippetedMessages, closeSnippetedMessages } from '../../actions/snippetedMessages';
import styles from './styles';
import Message from '../../containers/message';

@connect(
	state => ({
		messages: state.snippetedMessages.messages,
		user: state.login.user,
		baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
	}),
	dispatch => ({
		openSnippetedMessages: rid => dispatch(openSnippetedMessages(rid)),
		closeSnippetedMessages: () => dispatch(closeSnippetedMessages())
	})
)
export default class SnippetedMessagesView extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object,
		messages: PropTypes.array,
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		openSnippetedMessages: PropTypes.func,
		closeSnippetedMessages: PropTypes.func
	}

	componentDidMount() {
		this.props.openSnippetedMessages(this.props.navigation.state.params.rid);
	}

	componentWillUnmount() {
		this.props.closeSnippetedMessages();
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer}>
			<Text>No snippet messages</Text>
		</View>
	)

	renderItem = ({ item }) => (
		<Message
			item={item}
			style={styles.message}
			reactions={item.reactions}
			user={this.props.user}
			baseUrl={this.props.baseUrl}
			Message_TimeFormat='MMMM Do YYYY, h:mm:ss a'
			onLongPress={() => {}}
		/>
	)

	render() {
		if (this.props.messages.length === 0) {
			return this.renderEmpty();
		}
		return (
			<FlatList
				key='snippet-messages-view-list'
				data={this.props.messages}
				renderItem={this.renderItem}
				style={styles.list}
				keyExtractor={item => item._id}
			/>
		);
	}
}
