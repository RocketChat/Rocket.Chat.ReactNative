import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';
import equal from 'deep-equal';
import moment from 'moment';
import { connect } from 'react-redux';

import Avatar from '../../containers/Avatar';
import styles from './styles';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import StatusBar from '../../containers/StatusBar';

class ReadReceiptView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Read_Receipt')
	}

	static propTypes = {
		navigation: PropTypes.object,
		Message_TimeFormat: PropTypes.string,
		baseUrl: PropTypes.string,
		userId: PropTypes.string,
		token: PropTypes.string
	}

	constructor(props) {
		super(props);
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
			const result = await RocketChat.getReadReceipts(this.messageId);
			if (result.success) {
				this.setState({
					receipts: result.receipts,
					loading: false
				});
			}
		} catch (error) {
			this.setState({ loading: false });
			console.log('err_fetch_read_receipts', error);
		}
	}

	renderEmpty = () => (
		<View style={styles.listEmptyContainer} testID='read-receipt-view'>
			<Text>{I18n.t('No_Read_Receipts')}</Text>
		</View>
	)

	renderItem = ({ item }) => {
		const {
			Message_TimeFormat, userId, baseUrl, token
		} = this.props;
		const time = moment(item.ts).format(Message_TimeFormat);
		return (
			<View style={styles.itemContainer}>
				<Avatar
					text={item.user.username}
					size={40}
					baseUrl={baseUrl}
					userId={userId}
					token={token}
				/>
				<View style={styles.infoContainer}>
					<View style={styles.item}>
						<Text style={styles.name}>
							{item.user.name}
						</Text>
						<Text>
							{time}
						</Text>
					</View>
					<Text>
						{`@${ item.user.username }`}
					</Text>
				</View>
			</View>
		);
	}

	renderSeparator = () => <View style={styles.separator} />;

	render() {
		const { receipts, loading } = this.state;

		if (!loading && receipts.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView style={styles.container} testID='read-receipt-view' forceInset={{ bottom: 'always' }}>
				<StatusBar />
				<View>
					{loading
						? <RCActivityIndicator />
						: (
							<FlatList
								data={receipts}
								renderItem={this.renderItem}
								ItemSeparatorComponent={this.renderSeparator}
								style={styles.list}
								keyExtractor={item => item._id}
							/>
						)}
				</View>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	Message_TimeFormat: state.settings.Message_TimeFormat,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	userId: state.login.user && state.login.user.id,
	token: state.login.user && state.login.user.token
});

export default connect(mapStateToProps)(ReadReceiptView);
