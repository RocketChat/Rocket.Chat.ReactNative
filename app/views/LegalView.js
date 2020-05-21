import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, View, StyleSheet
} from 'react-native';
import { connect } from 'react-redux';

import Touch from '../utils/touch';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import DisclosureIndicator from '../containers/DisclosureIndicator';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import openLink from '../utils/openLink';
import { withTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';

const styles = StyleSheet.create({
	scroll: {
		marginTop: 35,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		width: '100%',
		marginLeft: 20
	},
	item: {
		width: '100%',
		height: 48,
		paddingLeft: 20,
		paddingRight: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	text: {
		...sharedStyles.textMedium,
		fontSize: 18
	}
});

const Separator = ({ theme }) => <View style={[styles.separator, { backgroundColor: themes[theme].separatorColor }]} />;
Separator.propTypes = {
	theme: PropTypes.string
};

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

	renderItem = ({ text, route, testID }) => {
		const { theme } = this.props;
		return (
			<Touch
				style={[styles.item, { backgroundColor: themes[theme].backgroundColor }]}
				onPress={() => this.onPressItem({ route })}
				testID={testID}
				theme={theme}
			>
				<Text style={[styles.text, { color: themes[theme].titleText }]}>{I18n.t(text)}</Text>
				<DisclosureIndicator theme={theme} />
			</Touch>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<SafeAreaView testID='legal-view' theme={theme}>
				<StatusBar theme={theme} />
				<ScrollView
					contentContainerStyle={[
						styles.scroll,
						{
							backgroundColor: themes[theme].backgroundColor,
							borderColor: themes[theme].separatorColor
						}
					]}
					{...scrollPersistTaps}
				>
					{this.renderItem({ text: 'Terms_of_Service', route: 'terms-of-service', testID: 'legal-terms-button' })}
					<Separator theme={theme} />
					{this.renderItem({ text: 'Privacy_Policy', route: 'privacy-policy', testID: 'legal-privacy-button' })}
				</ScrollView>
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
