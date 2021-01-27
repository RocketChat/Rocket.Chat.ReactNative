import React from 'react';
import {
	FlatList, StyleSheet, View
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import ServerItem, { ROW_HEIGHT } from '../presentation/ServerItem';
import sharedStyles from './Styles';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.id;

const styles = StyleSheet.create({
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
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	state = { servers: [] };

	async componentDidMount() {
		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		const servers = await serversCollection.query(Q.where('rooms_updated_at', Q.notEq(null))).fetch();
		this.setState({ servers });
	}

	select = async(server) => {
		const {
			server: currentServer, navigation
		} = this.props;

		navigation.navigate('ShareListView');
		if (currentServer !== server) {
			await RocketChat.shareExtensionInit(server);
		}
	}

	renderItem = ({ item }) => {
		const { server } = this.props;
		return (
			<ServerItem
				onPress={() => this.select(item.id)}
				item={item}
				hasCheck={item.id === server}
			/>
		);
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[styles.separator, { borderColor: themes[theme].separatorColor }]} />;
	}

	render() {
		const { servers } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView>
				<StatusBar />
				<View style={[styles.list, { borderColor: themes[theme].separatorColor }]}>
					<FlatList
						data={servers}
						keyExtractor={keyExtractor}
						renderItem={this.renderItem}
						getItemLayout={getItemLayout} // Refactor row_height
						contentContainerStyle={{ backgroundColor: themes[theme].backgroundColor }}
						ItemSeparatorComponent={this.renderSeparator}
						enableEmptySections
						removeClippedSubviews
						keyboardShouldPersistTaps='always'
						bounces={false}
					/>
				</View>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (({ share }) => ({
	server: share.server.server
}));

export default connect(mapStateToProps)(withTheme(SelectServerView));
