import * as React from 'react';
import { CommonActions, StackActions } from '@react-navigation/native';

const navigationRef = React.createRef();

function navigate(name, params) {
	navigationRef.current?.navigate(name, params);
	// navigationRef.current?.dispatch({ type: 'JUMP_TO', payload: { name, params } });
  // console.log('navigate -> navigationRef', navigationRef, name);
}

function back() {
	navigationRef.current?.dispatch(CommonActions.goBack());
}

function replace(name, params) {
	navigationRef.current?.dispatch(StackActions.replace(name, params));
}

export default {
	navigationRef,
	navigate,
	back,
	replace
};
