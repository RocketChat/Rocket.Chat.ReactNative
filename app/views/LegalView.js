import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import openLink from '../utils/openLink';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';

class LegalView extends React.Component {
	static propTypes = {
		server: PropTypes.string,
		theme: PropTypes.string
	}

	onPressItem = ({ route }) => {
		const { server, theme } = this.props;
		if (!server) {
			return;
		}
		openLink(`${ server }/${ route }`, theme);
	}

	render() {
		return (
			<SafeAreaView testID='legal-view'>
				<StatusBar />
				<List.Container>
					<List.Section>
						<List.Separator />
						<List.Item
							title='Terms_of_Service'
							onPress={() => this.onPressItem({ route: 'terms-of-service' })}
							testID='legal-terms-button'
							showActionIndicator
						/>
						<List.Separator />
						<List.Item
							title='Privacy_Policy'
							onPress={() => this.onPressItem({ route: 'privacy-policy' })}
							testID='legal-privacy-button'
							showActionIndicator
						/>
						<List.Separator />
					</List.Section>
				</List.Container>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server
});

LegalView.navigationOptions = {
	title: I18n.t('Legal')
};

export default connect(mapStateToProps)(withTheme(LegalView));
