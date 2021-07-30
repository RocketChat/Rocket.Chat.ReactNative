import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FlatList, StyleSheet, Switch } from 'react-native';
import { connect } from 'react-redux';

import StatusBar from '../containers/StatusBar';
import I18n from '../i18n';
import * as List from '../containers/List';
import Status from '../containers/Status/Status';
import TextInput from '../containers/TextInput';
import EventEmitter from '../utils/events';
import { showErrorAlert } from '../utils/info';
import Loading from '../containers/Loading';
import RocketChat from '../lib/rocketchat';
import log, { logEvent, events } from '../utils/log';

import { LISTENER } from '../containers/Toast';
import { withTheme } from '../theme';
import { getUserSelector } from '../selectors/login';
import * as HeaderButton from '../containers/HeaderButton';
import { setUser as setUserAction } from '../actions/login';
import SafeAreaView from '../containers/SafeAreaView';


const styles = StyleSheet.create({
	inputContainer: {
		marginTop: 32,
		marginBottom: 32
	},
	inputLeft: {
		position: 'absolute',
		top: 12,
		left: 12
	},
	inputStyle: {
		paddingLeft: 48
	}
});

const DisplayPrefsView = (props) => {
	const [loading, setLoading] = useState(false);



	// constructor(props) {
	// 	super(props);

	// 	const { statusText } = props.user;
	// 	this.state = { statusText: statusText || '', loading: false };
	// 	this.setHeader();
	// }


	const setHeader = () => {
		const { navigation, isMasterDetail } = props;
		navigation.setOptions({
			title: I18n.t('Display'),
			headerLeft: () => (isMasterDetail ? (
				<HeaderButton.CloseModal navigation={navigation} testID='display-view-close' />
			) : (
				<HeaderButton.Drawer navigation={navigation} testID='display-view-drawer' />
			))
		});
	};
	useEffect(() => {
		setHeader();
	}, []);

	const renderAvatarSwitch = () => (
		<Switch />
	);


	return (
		<SafeAreaView testID='status-view'>
			<StatusBar />
			<List.Container testID='display-view-list'>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Display'
					/>
					<List.Item
						title='Avatars'
						right={() => renderAvatarSwitch()}
					/>
				</List.Section>



			</List.Container>

			<Loading visible={loading} />
		</SafeAreaView>
	);
};

DisplayPrefsView.propTypes = {
	user: PropTypes.shape({
		id: PropTypes.string,
		status: PropTypes.string,
		statusText: PropTypes.string
	}),
	theme: PropTypes.string,
	navigation: PropTypes.object,
	isMasterDetail: PropTypes.bool,
	setUser: PropTypes.func,
	Accounts_AllowInvisibleStatusOption: PropTypes.bool
};

export default (withTheme(DisplayPrefsView));
