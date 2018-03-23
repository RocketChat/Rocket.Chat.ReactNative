import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Text, View } from 'react-native';
import { connect } from 'react-redux';

import { openRoomFiles, closeRoomFiles } from '../../actions/roomFiles';
import styles from './styles';
import Message from '../../containers/message';

@connect(
	state => ({
		messages: state.roomFiles.messages,
		user: state.login.user,
		baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
	}),
	dispatch => ({
		openRoomFiles: rid => dispatch(openRoomFiles(rid)),
		closeRoomFiles: () => dispatch(closeRoomFiles())
	})
)
export default class RoomFilesView extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object,
		messages: PropTypes.array,
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		openRoomFiles: PropTypes.func,
		closeRoomFiles: PropTypes.func
	}

	componentDidMount() {
		this.props.openRoomFiles(this.props.navigation.state.params.rid);
	}

	componentWillUnmount() {
		this.props.closeRoomFiles();
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer}>
			<Text>No files</Text>
		</View>
	)

	renderItem = ({ item }) => (
		<Message
			item={item}
			style={styles.message}
			user={this.props.user}
			baseUrl={this.props.baseUrl}
			Message_TimeFormat='MMMM Do YYYY, h:mm:ss a'
		/>
	)

	render() {
		if (this.props.messages.length === 0) {
			return this.renderEmpty();
		}
		return (
			<FlatList
				key='room-files-view-list'
				data={this.props.messages}
				renderItem={this.renderItem}
				style={styles.list}
				keyExtractor={item => item._id}
			/>
		);
	}
}
