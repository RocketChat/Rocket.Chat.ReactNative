import React, { useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import openLink from '../lib/methods/helpers/openLink';
import { useTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';
import NewWindowIcon from '../containers/NewWindowIcon';
import { OutsideParamList } from '../stacks/types';
import { IBaseScreen, IApplicationState } from '../definitions';

interface ILegalViewProps extends IBaseScreen<OutsideParamList, 'LegalView'> {
	server: string;
}

const LegalView = ({ navigation }: ILegalViewProps): React.ReactElement => {
	const server = useSelector((state: IApplicationState) => state.server.server);
	const { theme } = useTheme();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Legal')
		});
	}, []);

	const onPressItem = ({ route }: { route: string }) => {
		if (!server) {
			return;
		}
		openLink(`${server}/${route}`, theme);
	};

	return (
		<SafeAreaView testID='legal-view'>
			<StatusBar />
			<List.Container>
				<List.Section>
					<List.Separator />
					<List.Item
						title='Terms_of_Service'
						onPress={() => onPressItem({ route: 'terms-of-service' })}
						testID='legal-terms-button'
						right={() => <NewWindowIcon />}
						accessibilityRole='link'
					/>
					<List.Separator />
					<List.Item
						title='Privacy_Policy'
						onPress={() => onPressItem({ route: 'privacy-policy' })}
						testID='legal-privacy-button'
						right={() => <NewWindowIcon />}
						accessibilityRole='link'
					/>
					<List.Separator />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default LegalView;
