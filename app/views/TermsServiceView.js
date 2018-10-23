import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';
import SafeAreaView from 'react-native-safe-area-view';

import styles from './Styles';
import LoggedView from './View';

@connect(state => ({
	termsService: state.settings.Layout_Terms_of_Service
}))
/** @extends React.Component */
export default class TermsServiceView extends LoggedView {
	static propTypes = {
		termsService: PropTypes.string
	}

	constructor(props) {
		super('TermsServiceView', props);
	}

	render() {
		const { termsService } = this.props;
		return (
			<SafeAreaView style={styles.container}>
				<WebView originWhitelist={['*']} source={{ html: termsService, baseUrl: '' }} />
			</SafeAreaView>
		);
	}
}
