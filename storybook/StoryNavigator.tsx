import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { themes } from '../app/lib/constants';

/**
 * https://davidl.fr/blog/react-navigation-object-storybook
 * Helper component tor create a Dummy Stack to access {navigation} object on *.story.tsx files
 *
 * @usage add this decorator
 * ```
 * .addDecorator(NavigationDecorator)
 * ```
 */

const StoryBookStack = createStackNavigator();

export const NavigationDecorator = (story: any) => {
	const Screen = () => story();
	return (
		<NavigationContainer independent={true}>
			<StoryBookStack.Navigator>
				<StoryBookStack.Screen
					name='StorybookNavigator'
					component={Screen}
					options={{ header: () => null, cardStyle: { backgroundColor: themes.light.backgroundColor } }}
				/>
			</StoryBookStack.Navigator>
		</NavigationContainer>
	);
};
