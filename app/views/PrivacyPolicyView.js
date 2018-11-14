import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';
import SafeAreaView from 'react-native-safe-area-view';

import styles from './Styles';
import LoggedView from './View';
import { DARK_HEADER } from '../constants/headerOptions';
import I18n from '../i18n';

@connect(state => ({
	privacyPolicy: state.settings.Layout_Privacy_Policy
}))
/** @extends React.Component */
export default class PrivacyPolicyView extends LoggedView {
	static options() {
		return {
			...DARK_HEADER,
			topBar: {
				...DARK_HEADER.topBar,
				title: {
					...DARK_HEADER.topBar.title,
					text: I18n.t('Privacy_Policy')
				}
			}
		};
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
				<WebView originWhitelist={['*']} source={{ html: privacyPolicy, baseUrl: '' }} />
			</SafeAreaView>
		);
	}
}
