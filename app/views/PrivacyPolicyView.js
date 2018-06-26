import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';

/** @extends React.Component */
class PrivacyPolicyView extends React.PureComponent {
	static propTypes = {
		privacyPolicy: PropTypes.string
	}

	render() {
		return (
			<WebView source={{ html: this.props.privacyPolicy }} />
		);
	}
}

const mapStateToProps = state => ({
	privacyPolicy: state.settings.Layout_Privacy_Policy
});

export default connect(mapStateToProps, null)(PrivacyPolicyView);
