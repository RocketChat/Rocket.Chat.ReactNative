import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Text, View } from 'react-native';
import { connect } from 'react-redux';

import { openMentionedMessages, closeMentionedMessages } from '../../actions/mentionedMessages';
import styles from './styles';
import Message from '../../containers/message';

@connect(
	state => ({
		messages: state.mentionedMessages.messages,
		user: state.login.user,
		baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
	}),
	dispatch => ({
		openMentionedMessages: rid => dispatch(openMentionedMessages(rid)),
		closeMentionedMessages: () => dispatch(closeMentionedMessages())
	})
)
export default class MentionedMessagesView extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object,
		messages: PropTypes.array,
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		openMentionedMessages: PropTypes.func,
		closeMentionedMessages: PropTypes.func
	}

	componentDidMount() {
		this.props.openMentionedMessages(this.props.navigation.state.params.rid);
	}

	componentWillUnmount() {
		this.props.closeMentionedMessages();
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer}>
			<Text>No mentioned messages</Text>
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
				key='mentioned-messages-view-list'
				data={this.props.messages}
				renderItem={this.renderItem}
				style={styles.list}
				keyExtractor={item => item._id}
			/>
		);
	}
}
