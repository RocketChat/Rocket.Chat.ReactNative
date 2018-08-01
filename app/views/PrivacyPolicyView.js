import React from 'react';
import PropTypes from 'prop-types';
import { WebView, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';

import styles from './Styles';

@connect(state => ({
	privacyPolicy: state.settings.Layout_Privacy_Policy
}))
export default class PrivacyPolicyView extends React.PureComponent {
	static propTypes = {
		privacyPolicy: PropTypes.string
	}

	render() {
		return (
			<SafeAreaView style={styles.container}>
				<WebView originWhitelist={['*']} source={{ html: this.props.privacyPolicy, baseUrl: '' }} />
			</SafeAreaView>
		);
	}
}
