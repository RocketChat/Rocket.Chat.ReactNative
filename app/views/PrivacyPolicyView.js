import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';

class PrivacyPolicyView extends React.Component {
	static propTypes = {
		privacyPolicy: PropTypes.string
	}

	static navigationOptions = () => ({
		title: 'Terms of service'
	});

	render() {
		return (
			<WebView source={{ html: this.props.privacyPolicy }} />
		);
	}
}

function mapStateToProps(state) {
	return {
		privacyPolicy: state.settings.Layout_Privacy_Policy
	};
}

export default connect(mapStateToProps)(PrivacyPolicyView);
