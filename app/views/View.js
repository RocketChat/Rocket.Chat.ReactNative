import React from 'react';
import { Answers } from 'react-native-fabric';

export default class extends React.Component {
	constructor(name, props) {
		super(props);
		Answers.logContentView(name);
	}
}
