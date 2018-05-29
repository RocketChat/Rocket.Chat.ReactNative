import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native';
import { connect } from 'react-redux';

class TermsServiceView extends React.PureComponent {
	static propTypes = {
		termsService: PropTypes.string
	}

	render() {
		return (
			<WebView source={{ html: this.props.termsService }} />
		);
	}
}

function mapStateToProps(state) {
	return {
		termsService: state.settings.Layout_Terms_of_Service
	};
}

export default connect(mapStateToProps)(TermsServiceView);
