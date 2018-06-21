import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';

class PrivacyPolicyView extends React.PureComponent {
	static propTypes = {
		privacyPolicy: PropTypes.string
	}

	static get options() {
		return {
			topBar: {
				title: {
					text: 'Privacy Policy'
				}
			}
		};
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

export default connect(mapStateToProps, null, null, { withRef: true })(PrivacyPolicyView);
