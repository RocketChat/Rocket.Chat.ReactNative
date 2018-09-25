import React from 'react';
import PropTypes from 'prop-types';
import { WebView, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';

import styles from './Styles';
import LoggedView from './View';

@connect(state => ({
	privacyPolicy: state.settings.Layout_Privacy_Policy
}))
/** @extends React.Component */
export default class PrivacyPolicyView extends LoggedView {
	static propTypes = {
		privacyPolicy: PropTypes.string
	}

	constructor(props) {
		super('PrivacyPolicyView', props);
	}

	render() {
		const { privacyPolicy } = this.props;

		return (
			<SafeAreaView style={styles.container}>
				<WebView originWhitelist={['*']} source={{ html: privacyPolicy, baseUrl: '' }} />
			</SafeAreaView>
		);
	}
}
