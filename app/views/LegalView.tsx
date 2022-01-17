import React from 'react';
import { connect } from 'react-redux';
import { StackNavigationOptions } from '@react-navigation/stack';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import openLink from '../utils/openLink';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';

interface ILegalView {
	server: string;
	theme: string;
}

class LegalView extends React.Component<ILegalView, any> {
	static navigationOptions = (): StackNavigationOptions => ({
		title: I18n.t('Legal')
	});

	onPressItem = ({ route }: { route: string }) => {
		const { server, theme } = this.props;
		if (!server) {
			return;
		}
		openLink(`${server}/${route}`, theme);
	};

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

const mapStateToProps = (state: any) => ({
	server: state.server.server
});

export default connect(mapStateToProps)(withTheme(LegalView));
