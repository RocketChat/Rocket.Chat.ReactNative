import * as React from 'react';
import { CommonActions } from '@react-navigation/native';

const navigationRef = React.createRef();

function navigate(name, params) {
  navigationRef.current?.navigate(name, params);
}

function back() {
	navigationRef.current?.dispatch(CommonActions.goBack());
}

export default {
	navigationRef,
	navigate,
	back
};
