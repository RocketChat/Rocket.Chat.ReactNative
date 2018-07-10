import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';

@connect(state => ({
	termsService: state.settings.Layout_Terms_of_Service
}))
export default class TermsServiceView extends React.PureComponent {
	static propTypes = {
		termsService: PropTypes.string
	}

	render() {
		return (
			<WebView source={{ html: this.props.termsService }} />
		);
	}
}
