import * as React from 'react';

const navigationRef = React.createRef();
const routeNameRef = React.createRef();

function navigate(name, params) {
  navigationRef.current?.navigate(name, params);
}

export default {
	navigationRef,
	routeNameRef,
	navigate
};
