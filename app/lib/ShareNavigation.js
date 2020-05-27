import * as React from 'react';

const navigationRef = React.createRef();

function navigate(name, params) {
  navigationRef.current?.navigate(name, params);
}

export default {
	navigationRef,
	navigate
};
