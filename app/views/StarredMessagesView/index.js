import React from 'react';
import PropTypes from 'prop-types';
import { View, Platform, FlatList, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import { openStarredMessages, closeStarredMessages } from '../../actions/starredMessages';
import styles from './styles';
import Message from '../../containers/message';

@connect(
	state => ({
		messages: state.starredMessages.messages,
		user: state.login.user,
		baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
		Message_TimeFormat: state.settings.Message_TimeFormat
	}),
	dispatch => ({
		openStarredMessages: rid => dispatch(openStarredMessages(rid)),
		closeStarredMessages: () => dispatch(closeStarredMessages())
	})
)
export default class StarredMessagesView extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object,
		messages: PropTypes.array,
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		Message_TimeFormat: PropTypes.string,
		openStarredMessages: PropTypes.func,
		closeStarredMessages: PropTypes.func
	}

	componentWillMount() {
		this.props.openStarredMessages(this.props.navigation.state.params.rid);
	}

	// componentWillReceiveProps() {
	// 	this.props.messages.map(m => {
	// 		console.warn(m)
	// 	})
	// }

	componentWillUnmount() {
		this.props.closeStarredMessages();
	}

	renderItem = ({ item }) => (
		<Message
			item={item}
			style={styles.message}
			reactions={item.reactions}
			user={this.props.user}
			baseUrl={this.props.baseUrl}
			Message_TimeFormat={this.props.Message_TimeFormat}
		/>
	)

	render() {
		return (
			<FlatList
				data={this.props.messages}
				renderItem={this.renderItem}
				style={styles.list}
				keyExtractor={item => item.id}
			/>
		);
	}
}
