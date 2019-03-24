import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import LoggedView from '../View';
import styles from './styles';
import Message from '../../containers/message/Message';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import StatusBar from '../../containers/StatusBar';


/** @extends React.Component */
export default class ReadReceiptsView extends LoggedView {
	static navigationOptions = {
		title: I18n.t('Read_Receipt')
	}

	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super('ReadReceiptsView', props);
		this.messageId = props.navigation.getParam('messageId');
		this.state = {
			loading: false,
			receipts: []
		};
	}

	componentDidMount() {
		this.load();
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { loading, receipts } = this.state;
		if (nextState.loading !== loading) {
			return true;
		}
		if (!equal(nextState.receipts, receipts)) {
			return true;
		}
		return false;
	}

	load = async() => {
		const { loading } = this.state;
		if (loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await RocketChat.getReadReceips(this.messageId);
			if (result.success) {
				console.warn(result.success)
				this.setState({ receipts: result.receipts,
					loading: false
				});
			}
		} catch (error) {
			this.setState({ loading: false });
			console.log('ReadReceiptsView -> catch -> error', error);
		}
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='read-recepit-view'>
			<Text>{I18n.t('No_pinned_messages')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		return (
			/* <Message
				style={styles.message}
				customEmojis={customEmojis}
				baseUrl={baseUrl}
				user={user}
				author={item.u}
				ts={item.ts}
				msg={item.msg}
				attachments={item.attachments || []}
				timeFormat='MMM Do YYYY, h:mm:ss a'
				header
				edited={!!item.editedAt}
				onLongPress={() => this.onLongPress(item)}
			/> */
			<Text>
				{item.user.username}
			</Text>
		);
	}

	render() {
		const { receipts, loading } = this.state;

		if (!loading && receipts.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.list} testID='read-recepit-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				{loading
					? <RCActivityIndicator />
					: (
						<FlatList
							data={receipts}
							renderItem={this.renderItem}
							style={styles.list}
							keyExtractor={item => item._id}
						/>
					)}
			</SafeAreaView>
		);
	}
}
