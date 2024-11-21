import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';
import StatusBar from '../containers/StatusBar';
import { ChatsStackParamList } from '../stacks/types';
import { usePerformAppAction } from '../lib/hooks/usePerformAppAction';

type TNavigation = NativeStackNavigationProp<ChatsStackParamList, 'AIAppActionsView'>;
type TRoute = RouteProp<ChatsStackParamList, 'AIAppActionsView'>;

const AIAppActionsView = () => {
	const navigation = useNavigation<TNavigation>();
	const { aiAppActionButtons, rid } = useRoute<TRoute>().params;
	const performInteraction = usePerformAppAction(rid);

	useEffect(() => {
		const options: NativeStackNavigationOptions = {
			title: 'AI Actions'
		};

		navigation.setOptions(options);
	}, [navigation]);

	return (
		<SafeAreaView>
			<StatusBar />
			<List.Container>
				<List.Section>
					<List.Separator />
					<>
						{aiAppActionButtons.map(button => (
							<>
								<List.Item
									title={button.labelI18n}
									left={() => <List.Icon name='stars' />}
									translateTitle={false}
									key={`${button.appId}/${button.actionId}`}
									onPress={() => performInteraction(button)}
								/>
								<List.Separator />
							</>
						))}
					</>
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default AIAppActionsView;
