import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import SafeAreaView from 'react-native-safe-area-view';

import { openRoomFiles as openRoomFilesAction, closeRoomFiles as closeRoomFilesAction } from '../../actions/roomFiles';
import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';

@connect(state => ({
	messages: state.roomFiles.messages,
	ready: state.roomFiles.ready,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
}), dispatch => ({
	openRoomFiles: (rid, limit) => dispatch(openRoomFilesAction(rid, limit)),
	closeRoomFiles: () => dispatch(closeRoomFilesAction())
}))
/** @extends React.Component */
export default class RoomFilesView extends LoggedView {
	static options() {
		return {
			topBar: {
				title: {
					text: I18n.t('Files')
				}
			}
		};
	}

	static propTypes = {
		rid: PropTypes.string,
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
		const { ready } = this.props;
		if (nextProps.ready && nextProps.ready !== ready) {
			this.setState({ loading: false, loadingMore: false });
		}
	}

	componentWillUnmount() {
		const { closeRoomFiles } = this.props;
		closeRoomFiles();
	}

	load = () => {
		const { openRoomFiles, rid } = this.props;
		openRoomFiles(rid, this.limit);
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

	renderItem = ({ item }) => {
		const { user } = this.props;

		return (
			<Message
				item={item}
				style={styles.message}
				reactions={item.reactions}
				user={user}
				customTimeFormat='MMMM Do YYYY, h:mm:ss a'
			/>
		);
	}

	render() {
		const { messages, ready } = this.props;
		if (ready && messages.length === 0) {
			return this.renderEmpty();
		}

		const { loading, loadingMore } = this.state;
		return (
			<SafeAreaView style={styles.list} testID='room-files-view' forceInset={{ bottom: 'never' }}>
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					onEndReached={this.moreData}
					ListHeaderComponent={loading ? <RCActivityIndicator /> : null}
					ListFooterComponent={loadingMore ? <RCActivityIndicator /> : null}
				/>
			</SafeAreaView>
		);
	}
}
