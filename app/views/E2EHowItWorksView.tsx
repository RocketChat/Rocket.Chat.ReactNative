import React from 'react';
import { StyleSheet } from 'react-native';

import SafeAreaView from '../containers/SafeAreaView';
import { themes } from '../lib/constants';
import * as HeaderButton from '../containers/HeaderButton';
import Markdown from '../containers/markdown';
import { withTheme } from '../theme';
import I18n from '../i18n';
import { E2ESaveYourPasswordStackParamList } from '../stacks/types';
import { IBaseScreen } from '../definitions';

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

type TE2EHowItWorksViewProps = IBaseScreen<E2ESaveYourPasswordStackParamList, 'E2EHowItWorksView'>;

class E2EHowItWorksView extends React.Component<TE2EHowItWorksViewProps, any> {
	static navigationOptions = ({ route, navigation }: Pick<TE2EHowItWorksViewProps, 'navigation' | 'route'>) => {
		const showCloseModal = route.params?.showCloseModal;
		return {
			title: I18n.t('How_It_Works'),
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal navigation={navigation} /> : undefined
		};
	};

	render() {
		const { theme } = this.props;

		const infoStyle = [styles.info, { color: themes[theme].bodyText }];

		return (
			<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]} testID='e2e-how-it-works-view'>
				<Markdown msg={I18n.t('E2E_How_It_Works_info1')} style={infoStyle} theme={theme} />
				<Markdown msg={I18n.t('E2E_How_It_Works_info2')} style={infoStyle} theme={theme} />
				<Markdown msg={I18n.t('E2E_How_It_Works_info3')} style={infoStyle} theme={theme} />
				<Markdown msg={I18n.t('E2E_How_It_Works_info4')} style={infoStyle} theme={theme} />
			</SafeAreaView>
		);
	}
}

export default withTheme(E2EHowItWorksView);
