import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';

import SafeAreaView from '../containers/SafeAreaView';
import { themes } from '../constants/colors';
import * as HeaderButton from '../containers/HeaderButton';
import Markdown from '../containers/markdown';
import { withTheme } from '../theme';
import I18n from '../i18n';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 44,
		paddingTop: 32
	},
	info: {
		fontSize: 14,
		marginVertical: 8
	}
});

class E2EHowItWorksView extends React.Component {
	static navigationOptions = ({ route, navigation }) => {
		const showCloseModal = route.params?.showCloseModal;
		return {
			title: I18n.t('How_It_Works'),
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal navigation={navigation} /> : undefined
		};
	}

	static propTypes = {
		theme: PropTypes.string
	}

	render() {
		const { theme } = this.props;

		const infoStyle = [styles.info, { color: themes[theme].bodyText }];

		return (
			<SafeAreaView
				style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}
				testID='e2e-how-it-works-view'
			>
				<Markdown
					msg={I18n.t('E2E_How_It_Works_info1')}
					style={infoStyle}
					theme={theme}
				/>
				<Markdown
					msg={I18n.t('E2E_How_It_Works_info2')}
					style={infoStyle}
					theme={theme}
				/>
				<Markdown
					msg={I18n.t('E2E_How_It_Works_info3')}
					style={infoStyle}
					theme={theme}
				/>
				<Markdown
					msg={I18n.t('E2E_How_It_Works_info4')}
					style={infoStyle}
					theme={theme}
				/>
			</SafeAreaView>
		);
	}
}

export default withTheme(E2EHowItWorksView);
