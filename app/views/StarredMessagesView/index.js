import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from 'react-native-action-sheet';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message/Message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import StatusBar from '../../containers/StatusBar';

const STAR_INDEX = 0;
const CANCEL_INDEX = 1;
const options = [I18n.t('Unstar'), I18n.t('Cancel')];

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	customEmojis: state.customEmojis,
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
}))
/** @extends React.Component */
export default class StarredMessagesView extends LoggedView {
	static navigationOptions = {
		title: I18n.t('Starred')
	}

	static propTypes = {
		user: PropTypes.object,
		baseUrl: PropTypes.string,
		customEmojis: PropTypes.object,
		navigation: PropTypes.object
	}

	constructor(props) {
		super('StarredMessagesView', props);
		this.state = {
			loading: false,
			messages: []
		};
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
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

	onLongPress = (message) => {
		this.setState({ message });
		this.showActionSheet();
	}

	showActionSheet = () => {
		ActionSheet.showActionSheetWithOptions({
			options,
			cancelButtonIndex: CANCEL_INDEX,
			title: I18n.t('Actions')
		}, (actionIndex) => {
			this.handleActionPress(actionIndex);
		});
	}

	handleActionPress = (actionIndex) => {
		switch (actionIndex) {
			case STAR_INDEX:
				this.unStar();
				break;
			default:
				break;
		}
	}

	unStar = async() => {
		const { message } = this.state;
		try {
			const result = await RocketChat.toggleStarMessage(message);
			if (result.success) {
				this.setState(prevState => ({
					messages: prevState.messages.filter(item => item._id !== message._id)
				}));
			}
		} catch (error) {
			console.log('StarredMessagesView -> unStar -> catch -> error', error);
		}
	}

	load = async() => {
		const {
			messages, total, loading
		} = this.state;
		const { user } = this.props;
		if (messages.length === total || loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await RocketChat.getMessages(
				this.rid,
				this.t,
				{ 'starred._id': { $in: [user.id] } },
				messages.length
			);
			if (result.success) {
				this.setState(prevState => ({
					messages: [...prevState.messages, ...result.messages],
					total: result.total,
					loading: false
				}));
			}
		} catch (error) {
			this.setState({ loading: false });
			console.log('StarredMessagesView -> load -> catch -> error', error);
		}
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='starred-messages-view'>
			<Text style={styles.noDataFound}>{I18n.t('No_starred_messages')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const { user, customEmojis, baseUrl } = this.props;
		return (
			<Message
				customEmojis={customEmojis}
				baseUrl={baseUrl}
				user={user}
				author={item.u}
				ts={item.ts}
				msg={item.msg}
				attachments={item.attachments || []}
				timeFormat='MMM Do YYYY, h:mm:ss a'
				edited={!!item.editedAt}
				header
				onLongPress={() => this.onLongPress(item)}
			/>
		);
	}

	render() {
		const { messages, loading } = this.state;

		if (!loading && messages.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID='starred-messages-view' forceInset={{ bottom: 'never' }}>
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
