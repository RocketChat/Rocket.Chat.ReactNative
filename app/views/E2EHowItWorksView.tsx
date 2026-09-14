import { StackActions, type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { headerItems } from '~/lib/methods/helpers/navigation';
import Markdown from '../containers/markdown';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import { type E2ESaveYourPasswordStackParamList } from '../stacks/types';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
	}
});

const E2EHowItWorksView = (): ReactElement => {
	const navigation = useNavigation();
	const { setOptions } = navigation;
	const { colors } = useTheme();
	const { params } = useRoute<RouteProp<E2ESaveYourPasswordStackParamList, 'E2EHowItWorksView'>>();

	useEffect(() => {
		setOptions({
			title: I18n.t('How_It_Works'),
			...headerItems({
				left: params?.showCloseModal
					? [
							{
								type: 'button',
								label: I18n.t('Close'),
								iconName: 'close',
								onPress: () => navigation.dispatch(StackActions.pop())
							}
						]
					: undefined
			})
		});
	}, []);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceRoom }]} testID='e2e-how-it-works-view'>
			<Markdown msg={I18n.t('E2E_How_It_Works_info1')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info2')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info3')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info4')} />
		</SafeAreaView>
	);
};

export default E2EHowItWorksView;
