import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';

@connect(state => ({
	privacyPolicy: state.settings.Layout_Privacy_Policy
}))
export default class PrivacyPolicyView extends React.PureComponent {
	static propTypes = {
		privacyPolicy: PropTypes.string
	}

	render() {
		return (
			<WebView source={{ html: this.props.privacyPolicy }} />
		);
	}
}
