import React from 'react';
import PropTypes from 'prop-types';
import { WebView, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';

import styles from './Styles';

@connect(state => ({
	termsService: state.settings.Layout_Terms_of_Service
}))
export default class TermsServiceView extends React.PureComponent {
	static propTypes = {
		termsService: PropTypes.string
	}

	render() {
		return (
			<SafeAreaView style={styles.container}>
				<WebView originWhitelist={['*']} source={{ html: this.props.termsService, baseUrl: '' }} />
			</SafeAreaView>
		);
	}
}
