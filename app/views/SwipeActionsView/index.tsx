import React, { useLayoutEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, FlatList } from 'react-native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as List from '../../containers/List';
import I18n from '../../i18n';
import userPreferences from '../../lib/methods/userPreferences';
import { type SettingsStackParamList } from '../../stacks/types';

const SWIPE_ACTIONS = [
	{ value: 'edit', title: 'Edit' },
	{ value: 'quote', title: 'Quote' },
	{ value: 'thread', title: 'Create_Thread' },
	{ value: 'none', title: 'None' }
];

const SwipeActionsView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'SwipeActionsView'>>();
	
	// Get swipe action preference from UserPreferences
	const [selectedAction, setSelectedAction] = useState(() => 
		userPreferences.getString('swipeLeftAction') || 'none'
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Message_Swipe_Actions')
		});
	}, [navigation]);

	const handleActionSelect = (action: string) => {
		try {
			console.log('actionswipe', action);
			userPreferences.setString('swipeLeftAction', action);
			setSelectedAction(action);
		} catch (e) {
			console.error('Error saving swipe left action:', e);
		}
	};

	const getActionTitle = (action: string) => {
		if (action === 'thread') {
			return I18n.t('Create_Thread');
		}
		return action.charAt(0).toUpperCase() + action.slice(1);
	};

	return (
		<SafeAreaView testID='swipe-actions-view'>
			<FlatList
				data={SWIPE_ACTIONS.map(action => ({
						key: action.value,
						value: action.value,
						title: action.title,
						isSelected: selectedAction === action.value,
						onPress: () => handleActionSelect(action.value),
						testID: `swipe-actions-view-${action.value}`
					}))
				}
				keyExtractor={item => item.key}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				renderItem={({ item }) => (
						<List.Radio
							isSelected={item.isSelected}
							title={getActionTitle(item.title)}
							value={item.value}
							onPress={item.onPress}
							testID={item.testID}
						/>
					)
				}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={()=>(
					<List.Info info={'Message_Swipe_Actions_Description'} />
				)}
			/>
		</SafeAreaView>
	);
};

export default SwipeActionsView;
