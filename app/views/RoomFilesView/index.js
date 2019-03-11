import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message/Message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import StatusBar from '../../containers/StatusBar';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	customEmojis: state.customEmojis,
	room: state.room,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
}))
/** @extends React.Component */
export default class RoomFilesView extends LoggedView {
	static navigationOptions = {
		title: I18n.t('Files')
	}

	static propTypes = {
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		customEmojis: PropTypes.object,
		room: PropTypes.object
	}

	constructor(props) {
		super('RoomFilesView', props);
		this.state = {
			loading: false,
			messages: []
		};
	}

	componentDidMount() {
		this.load();
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loading, messages } = this.state;
		if (nextState.loading !== loading) {
			return true;
		}
		if (!equal(nextState.messages, messages)) {
			return true;
		}
		return false;
	}

	load = async() => {
		const {
			messages, total, loading
		} = this.state;
		if (messages.length === total || loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			const { room } = this.props;
			const result = await RocketChat.getFiles(room.rid, room.t, messages.length);
			if (result.success) {
				this.setState(prevState => ({
					messages: [...prevState.messages, ...result.files],
					total: result.total,
					loading: false
				}));
			}
		} catch (error) {
			this.setState({ loading: false });
			console.log('RoomFilesView -> catch -> error', error);
		}
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='room-files-view'>
			<Text>{I18n.t('No_files')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const { user, baseUrl, customEmojis } = this.props;

		let url = {};
		if (/image/.test(item.type)) {
			url = { image_url: item.url };
		} else if (/audio/.test(item.type)) {
			url = { audio_url: item.url };
		} else if (/video/.test(item.type)) {
			url = { video_url: item.url };
		} else {
			url = {
				title_link: item.url,
				type: 'file'
			};
		}

		return (
			<Message
				style={styles.message}
				customEmojis={customEmojis}
				baseUrl={baseUrl}
				user={user}
				author={item.user}
				ts={item.uploadedAt}
				attachments={[{
					title: item.name,
					description: item.description,
					...url
				}]}
				timeFormat='MMM Do YYYY, h:mm:ss a'
				edited={!!item.editedAt}
				header
			/>
		);
	}

	render() {
		const { messages, loading } = this.state;

		if (!loading && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID='room-files-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<FlatList
					data={messages}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					onEndReached={this.load}
					ListFooterComponent={loading ? <RCActivityIndicator /> : null}
				/>
			</SafeAreaView>
		);
	}
}
