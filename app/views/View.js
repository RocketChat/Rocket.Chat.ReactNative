import React from 'react';
import PropTypes from 'prop-types';
import { Answers } from 'react-native-fabric';
import { NavigationActions } from '../Navigation';

/** @extends React.Component */
export default class extends React.Component {
	static propTypes = {
		navigator: PropTypes.object
	}
	constructor(name, props) {
		super(props);
		NavigationActions.setNavigator(props.navigator);
		Answers.logContentView(name);
	}
	componentDidCatch = (error, info) => {
		Answers.logCustom(error, info);
	}
}
