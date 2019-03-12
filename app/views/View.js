import React from 'react';
import { Answers } from 'react-native-fabric';

/** @extends React.Component */
export default class extends React.Component {
	constructor(name, props) {
		super(props);
		Answers.logContentView(name);
	}

	componentDidCatch = (error, info) => {
		Answers.logCustom(error, info);
	}
}
