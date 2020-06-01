import * as React from 'react';
import {
	useNavigationBuilder,
	createNavigatorFactory,
	StackRouter,
	TabRouter
} from '@react-navigation/native';
import { StackView } from '@react-navigation/stack';

const MyStackRouter = options => {
	const router = StackRouter(options);
  console.log('router', router);

	return {
		...router,
		getStateForAction(state, action, options) {
			switch (action.type) {
				case 'JUMP_TO':
				// case 'NAVIGATE': {
				// 	console.log('IUOADHUIASHDAIUOHAIUSHDIASUODASIUDHOAS')
				// 	return null;
				// }
				default:
					return router.getStateForAction(state, action, options);
			}
		},

		actionCreators: {
			...router.actionCreators,
			jumpTo(name, params) {
        console.log('jumpTo -> name, params', name, params);
				return { type: 'JUMP_TO', payload: { name, params } };
			},
		},
	};
};

function StackNavigator({
	initialRouteName,
	backBehavior,
	children,
	screenOptions,
  ...rest
}) {
	const { state, descriptors, navigation } = useNavigationBuilder(MyStackRouter, {
		initialRouteName,
		backBehavior,
		children,
		screenOptions,
	});
	console.log('navigation', navigation);

	return (
		<StackView
			{...rest}
			state={state}
			navigation={navigation}
			descriptors={descriptors}
		/>
	);
}

export default createNavigatorFactory(StackNavigator);