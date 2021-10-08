import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text } from 'react-native';
import { dequal } from 'dequal';
import moment from 'moment';
import { connect } from 'react-redux';
import * as List from '../../containers/List';

import Avatar from '../../containers/Avatar';
import styles from './styles';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/HeaderButton';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import StatusBar from '../../containers/StatusBar';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import SafeAreaView from '../../containers/SafeAreaView';

class ReadReceiptView extends React.Component {
	static navigationOptions = ({ navigation, isMasterDetail }) => {
		const options = {
			title: I18n.t('Read_Receipt')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='read-receipt-view-close' />;
		}
		return options;
	}

	static propTypes = {
		route: PropTypes.object,
		Message_TimeAndDateFormat: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.messageId = props.route.params?.messageId;
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
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.loading !== loading) {
			return true;
		}
		if (!dequal(nextState.receipts, receipts)) {
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

	renderEmpty = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].chatComponentBackground }]} testID='read-receipt-view'>
				<Text style={{ color: themes[theme].titleText }}>{I18n.t('No_Read_Receipts')}</Text>
			</View>
		);
	}

	renderItem = ({ item }) => {
		const { theme, Message_TimeAndDateFormat } = this.props;
		const time = moment(item.ts).format(Message_TimeAndDateFormat);
		if (!item?.user?.username) {
			return null;
		}
		return (
			<View style={[styles.itemContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Avatar
					text={item.user.username}
					size={40}
				/>
				<View style={styles.infoContainer}>
					<View style={styles.item}>
						<Text style={[styles.name, { color: themes[theme].titleText }]}>
							{item?.user?.name}
						</Text>
						<Text style={{ color: themes[theme].auxiliaryText }}>
							{time}
						</Text>
					</View>
					<Text style={{ color: themes[theme].auxiliaryText }}>
						{`@${ item.user.username }`}
					</Text>
				</View>
			</View>
		);
	}

	render() {
		const { receipts, loading } = this.state;
		const { theme } = this.props;

		if (!loading && receipts.length === 0) {
			return this.renderEmpty();
		}

		return (
			<SafeAreaView testID='read-receipt-view'>
				<StatusBar />
				{loading
					? <ActivityIndicator theme={theme} />
					: (
						<FlatList
							data={receipts}
							renderItem={this.renderItem}
							ItemSeparatorComponent={List.Separator}
							style={[
								styles.list,
								{
									backgroundColor: themes[theme].chatComponentBackground,
									borderColor: themes[theme].separatorColor
								}
							]}
							keyExtractor={item => item._id}
						/>
					)}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	Message_TimeAndDateFormat: state.settings.Message_TimeAndDateFormat
});

export default connect(mapStateToProps)(withTheme(ReadReceiptView));
