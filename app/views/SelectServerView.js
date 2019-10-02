import React from 'react';
import {
	FlatList, StyleSheet, View
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { COLOR_BACKGROUND_CONTAINER } from '../constants/colors';
import Navigation from '../lib/ShareNavigation';
import ServerItem, { ROW_HEIGHT } from '../presentation/ServerItem';
import sharedStyles from './Styles';
import RocketChat from '../lib/rocketchat';

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.id;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	list: {
		marginVertical: 32,
		...sharedStyles.separatorVertical
	},
	separator: {
		...sharedStyles.separatorBottom,
		marginLeft: 48
	}
});

class SelectServerView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Select_Server')
	})

	static propTypes = {
		server: PropTypes.string,
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		const { navigation } = this.props;
		const servers = navigation.getParam('servers', []);
		const filteredServers = servers.filter(server => server.roomsUpdatedAt);
		this.state = {
			servers: filteredServers
		};
	}

	select = async(server) => {
		const {
			server: currentServer
		} = this.props;

		Navigation.navigate('ShareListView');
		if (currentServer !== server) {
			await RocketChat.shareExtensionInit(server);
		}
	}

	renderItem = ({ item }) => {
		const { server } = this.props;
		return (
			<ServerItem
				server={server}
				onPress={() => this.select(item.id)}
				item={item}
				hasCheck
			/>
		);
	}

	renderSeparator = () => <View style={styles.separator} />;

	render() {
		const { servers } = this.state;
		return (
			<SafeAreaView
				style={styles.container}
				forceInset={{ vertical: 'never' }}
			>
				<StatusBar />
				<View style={styles.list}>
					<FlatList
						data={servers}
						keyExtractor={keyExtractor}
						renderItem={this.renderItem}
						getItemLayout={getItemLayout}
						ItemSeparatorComponent={this.renderSeparator}
						enableEmptySections
						removeClippedSubviews
						keyboardShouldPersistTaps='always'
						windowSize={7}
						bounces={false}
					/>
				</View>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (({ share }) => ({
	server: share.server
}));

export default connect(mapStateToProps)(SelectServerView);
