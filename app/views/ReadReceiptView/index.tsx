import React from 'react';
import { FlatList, Text, View, RefreshControl } from 'react-native';
import { dequal } from 'dequal';
import moment from 'moment';
import { connect } from 'react-redux';
import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/core';

import * as List from '../../containers/List';
import Avatar from '../../containers/Avatar';
import * as HeaderButton from '../../containers/HeaderButton';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { TSupportedThemes, withTheme } from '../../theme';
import { themes } from '../../lib/constants';
import SafeAreaView from '../../containers/SafeAreaView';
import styles from './styles';
import { ChatsStackParamList } from '../../stacks/types';
import { IApplicationState, IReadReceipts } from '../../definitions';
import { Services } from '../../lib/services';

interface IReadReceiptViewState {
	loading: boolean;
	receipts: IReadReceipts[];
}

interface INavigationOption {
	navigation: NativeStackNavigationProp<ChatsStackParamList, 'ReadReceiptsView'>;
	route: RouteProp<ChatsStackParamList, 'ReadReceiptsView'>;
	isMasterDetail: boolean;
}

interface IReadReceiptViewProps extends INavigationOption {
	Message_TimeAndDateFormat: string;
	theme: TSupportedThemes;
}

class ReadReceiptView extends React.Component<IReadReceiptViewProps, IReadReceiptViewState> {
	private messageId: string;

	static navigationOptions = ({ navigation, isMasterDetail }: INavigationOption) => {
		const options: NativeStackNavigationOptions = {
			title: I18n.t('Read_Receipt')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='read-receipt-view-close' />;
		}
		return options;
	};

	constructor(props: IReadReceiptViewProps) {
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

	shouldComponentUpdate(nextProps: IReadReceiptViewProps, nextState: IReadReceiptViewState) {
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

	load = async () => {
		const { loading } = this.state;
		if (loading) {
			return;
		}

		this.setState({ loading: true });

		try {
			const result = await Services.getReadReceipts(this.messageId);
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
	};

	renderEmpty = () => {
		const { loading } = this.state;
		const { theme } = this.props;
		if (loading) {
			return null;
		}
		return (
			<View style={[styles.listEmptyContainer, { backgroundColor: themes[theme].surfaceTint }]} testID='read-receipt-view'>
				<Text style={[styles.emptyText, { color: themes[theme].fontHint }]}>{I18n.t('No_Read_Receipts')}</Text>
			</View>
		);
	};

	renderItem = ({ item }: { item: IReadReceipts }) => {
		const { theme, Message_TimeAndDateFormat } = this.props;
		const time = moment(item.ts).format(Message_TimeAndDateFormat);
		if (!item?.user?.username) {
			return null;
		}
		return (
			<View style={[styles.itemContainer, { backgroundColor: themes[theme].surfaceRoom }]}>
				<Avatar text={item.user.username} size={40} />
				<View style={styles.infoContainer}>
					<View style={styles.item}>
						<Text style={[styles.name, { color: themes[theme].fontTitlesLabels }]}>{item?.user?.name}</Text>
						<Text style={[styles.time, { color: themes[theme].fontSecondaryInfo }]}>{time}</Text>
					</View>
					<Text
						style={[
							styles.username,
							{
								color: themes[theme].fontSecondaryInfo
							}
						]}>{`@${item.user.username}`}</Text>
				</View>
			</View>
		);
	};

	render() {
		const { receipts, loading } = this.state;
		const { theme } = this.props;

		return (
			<SafeAreaView testID='read-receipt-view'>
				<StatusBar />
				<FlatList
					data={receipts}
					renderItem={this.renderItem}
					ItemSeparatorComponent={List.Separator}
					ListEmptyComponent={this.renderEmpty}
					contentContainerStyle={List.styles.contentContainerStyleFlatList}
					style={[
						styles.list,
						{
							backgroundColor: themes[theme].surfaceTint,
							borderColor: themes[theme].strokeLight
						}
					]}
					refreshControl={
						<RefreshControl refreshing={loading} onRefresh={this.load} tintColor={themes[theme].fontSecondaryInfo} />
					}
					keyExtractor={item => item._id}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	Message_TimeAndDateFormat: state.settings.Message_TimeAndDateFormat as string
});

export default connect(mapStateToProps)(withTheme(ReadReceiptView));
