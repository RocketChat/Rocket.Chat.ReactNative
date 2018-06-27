import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';

import LoggedView from '../View';
import { openRoomFiles, closeRoomFiles } from '../../actions/roomFiles';
import styles from './styles';
import Message from '../../containers/message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';

/** @extends React.Component */
class RoomFilesView extends LoggedView {
	static propTypes = {
		rid: PropTypes.string,
		navigator: PropTypes.object,
		messages: PropTypes.array,
		ready: PropTypes.bool,
		user: PropTypes.object,
		openRoomFiles: PropTypes.func,
		closeRoomFiles: PropTypes.func
	}

	constructor(props) {
		super('RoomFilesView', props);
		this.state = {
			loading: true,
			loadingMore: false
		};
	}

	componentDidMount() {
		this.limit = 20;
		this.load();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.ready && nextProps.ready !== this.props.ready) {
			this.setState({ loading: false, loadingMore: false });
		}
	}

	componentWillUnmount() {
		this.props.closeRoomFiles();
	}

	load = () => {
		this.props.openRoomFiles(this.props.rid, this.limit);
	}

	moreData = () => {
		const { loadingMore } = this.state;
		const { messages } = this.props;
		if (messages.length < this.limit) {
			return;
		}
		if (!loadingMore) {
			this.setState({ loadingMore: true });
			this.limit += 20;
			this.load();
		}
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='room-files-view'>
			<Text>{I18n.t('No_files')}</Text>
		</View>
	)

	renderItem = ({ item }) => (
		<Message
			item={item}
			style={styles.message}
			reactions={item.reactions}
			user={this.props.user}
			customTimeFormat='MMMM Do YYYY, h:mm:ss a'
			onLongPress={() => {}}
		/>
	)

	render() {
		const { messages, ready } = this.props;
		if (ready && messages.length === 0) {
			return this.renderEmpty();
		}

		const { loading, loadingMore } = this.state;
		return (
			[
				<FlatList
					key='room-files-view-list'
					testID='room-files-view'
					data={messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					onEndReached={this.moreData}
					ListHeaderComponent={loading ? <RCActivityIndicator /> : null}
					ListFooterComponent={loadingMore ? <RCActivityIndicator /> : null}
				/>
			]
		);
	}
}

const mapStateToProps = state => ({
	messages: state.roomFiles.messages,
	ready: state.roomFiles.ready,
	user: state.login.user
});

const mapDispatchToProps = dispatch => ({
	openRoomFiles: (rid, limit) => dispatch(openRoomFiles(rid, limit)),
	closeRoomFiles: () => dispatch(closeRoomFiles())
});

export default connect(mapStateToProps, mapDispatchToProps)(RoomFilesView);
