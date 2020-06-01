import * as React from 'react';
import {
	useNavigationBuilder,
	createNavigatorFactory,
	TabRouter,
} from '@react-navigation/native';
import { DrawerView } from '@react-navigation/drawer';
import { DrawerRouter } from '@react-navigation/native';

const MyTabRouter = options => {
	const router = DrawerRouter(options);
  console.log('router', router);

	return {
		...router,
		getStateForAction(state, action, options) {
			switch (action.type) {
				case 'CLEAR_HISTORY':
					return {
						...state,
						routeKeyHistory: [],
					};
				default:
					return router.getStateForAction(state, action, options);
			}
		},

		actionCreators: {
			...router.actionCreators,
			jumpTo(name, params) {
        console.log('jumpTo -> name, params', name, params);
				// return { type: 'JUMP_TO', payload: { name, params } };
			},
		},
	};
};

function DrawerNavigator({
	initialRouteName,
	backBehavior,
	children,
	screenOptions,
  ...rest
}) {
	const { state, descriptors, navigation } = useNavigationBuilder(MyTabRouter, {
		initialRouteName,
		backBehavior,
		children,
		screenOptions,
	});

	return (
		<DrawerView
			{...rest}
			state={state}
			navigation={navigation}
			descriptors={descriptors}
		/>
	);
}

export default createNavigatorFactory(DrawerNavigator);