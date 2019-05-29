import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, View, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { RectButton } from 'react-native-gesture-handler';
import { connect } from 'react-redux';

import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import LoggedView from './View';
import I18n from '../i18n';
import DisclosureIndicator from '../containers/DisclosureIndicator';
import StatusBar from '../containers/StatusBar';
import { COLOR_SEPARATOR, COLOR_WHITE } from '../constants/colors';
import openLink from '../utils/openLink';

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f7f8fa',
		flex: 1
	},
	scroll: {
		marginTop: 35,
		backgroundColor: COLOR_WHITE,
		borderColor: COLOR_SEPARATOR,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	separator: {
		backgroundColor: COLOR_SEPARATOR,
		height: StyleSheet.hairlineWidth,
		width: '100%',
		marginLeft: 20
	},
	item: {
		width: '100%',
		height: 48,
		backgroundColor: COLOR_WHITE,
		paddingLeft: 20,
		paddingRight: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	text: {
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal,
		fontSize: 18
	}
});

const Separator = () => <View style={styles.separator} />;

@connect(state => ({
	server: state.server.server
}))
/** @extends React.Component */
export default class LegalView extends LoggedView {
	static navigationOptions = () => ({
		title: I18n.t('Legal')
	})

	static propTypes = {
		server: PropTypes.string
	}

	constructor(props) {
		super('LegalView', props);
	}

	onPressItem = ({ route }) => {
		const { server } = this.props;
		if (!server) {
			return;
		}
		openLink(`${ server }/${ route }`);
	}

	renderItem = ({ text, route, testID }) => (
		<RectButton style={styles.item} onPress={() => this.onPressItem({ route })} testID={testID}>
			<Text style={styles.text}>{I18n.t(text)}</Text>
			<DisclosureIndicator />
		</RectButton>
	)

	render() {
		return (
			<SafeAreaView style={styles.container} testID='legal-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.scroll}>
					{this.renderItem({ text: 'Terms_of_Service', route: 'terms-of-service', testID: 'legal-terms-button' })}
					<Separator />
					{this.renderItem({ text: 'Privacy_Policy', route: 'privacy-policy', testID: 'legal-privacy-button' })}
				</ScrollView>
			</SafeAreaView>
		);
	}
}
