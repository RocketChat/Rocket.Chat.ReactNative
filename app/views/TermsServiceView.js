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
	termsService: state.settings.Layout_Terms_of_Service
}))
/** @extends React.Component */
export default class TermsServiceView extends LoggedView {
	static options() {
		return {
			...DARK_HEADER,
			topBar: {
				...DARK_HEADER.topBar,
				title: {
					...DARK_HEADER.topBar.title,
					text: I18n.t('Terms_of_Service')
				}
			}
		};
	}

	static propTypes = {
		termsService: PropTypes.string
	}

	constructor(props) {
		super('TermsServiceView', props);
	}

	render() {
		const { termsService } = this.props;
		return (
			<SafeAreaView style={styles.container} testID='terms-view'>
				<WebView originWhitelist={['*']} source={{ html: termsService, baseUrl: '' }} />
			</SafeAreaView>
		);
	}
}
