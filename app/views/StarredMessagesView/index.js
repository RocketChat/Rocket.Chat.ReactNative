import React from 'react';
import PropTypes from 'prop-types';
import { View, Platform, FlatList, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-actionsheet';

import { openStarredMessages, closeStarredMessages } from '../../actions/starredMessages';
import styles from './styles';
import Message from '../../containers/message';
import { toggleStarRequest } from '../../actions/messages';

const STAR_INDEX = 0;
const CANCEL_INDEX = 1;
const options = ['Unstar', 'Cancel'];

@connect(
	state => ({
		messages: state.starredMessages.messages,
		user: state.login.user,
		baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
		Message_TimeFormat: state.settings.Message_TimeFormat
	}),
	dispatch => ({
		openStarredMessages: rid => dispatch(openStarredMessages(rid)),
		closeStarredMessages: () => dispatch(closeStarredMessages()),
		toggleStarRequest: message => dispatch(toggleStarRequest(message))
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
		closeStarredMessages: PropTypes.func,
		toggleStarRequest: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			message: {}
		};
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

	onLongPress = (message) => {
		this.setState({ message });
		this.actionSheet.show();
	}

	handleActionPress = (actionIndex) => {
		switch (actionIndex) {
			case STAR_INDEX:
				this.props.toggleStarRequest(this.state.message);
				break;
			default:
				break;
		}
	}

	renderItem = ({ item }) => (
		<Message
			item={item}
			style={styles.message}
			reactions={item.reactions}
			user={this.props.user}
			baseUrl={this.props.baseUrl}
			Message_TimeFormat={this.props.Message_TimeFormat}
			onLongPress={this.onLongPress}
		/>
	)

	render() {
		return (
			[
				<FlatList
					key='starred-messages-view-list'
					data={this.props.messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
				/>,
				<ActionSheet
					key='starred-messages-view-action-sheet'
					ref={o => this.actionSheet = o}
					title='Actions'
					options={options}
					cancelButtonIndex={CANCEL_INDEX}
					onPress={this.handleActionPress}
				/>
			]
		);
	}
}
