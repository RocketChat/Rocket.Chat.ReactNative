import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import styles from './Styles';
import LoggedView from './View';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';

@connect(state => ({
	privacyPolicy: state.settings.Layout_Privacy_Policy
}))
/** @extends React.Component */
export default class PrivacyPolicyView extends LoggedView {
	static navigationOptions = {
		title: I18n.t('Privacy_Policy')
	}

	static propTypes = {
		privacyPolicy: PropTypes.string
	}

	constructor(props) {
		super('PrivacyPolicyView', props);
	}

	render() {
		const { privacyPolicy } = this.props;

		return (
			<SafeAreaView style={styles.container} testID='privacy-view'>
				<StatusBar />
				<WebView originWhitelist={['*']} source={{ html: privacyPolicy, baseUrl: '' }} />
			</SafeAreaView>
		);
	}
}
