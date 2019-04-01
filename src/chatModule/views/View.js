import React from "react";
import { Platform } from "react-native";
import PropTypes from "prop-types";
// import { Answers } from 'react-native-fabric';
import { NavigationActions } from "../Navigation";

const isAndroid = () => Platform.OS === "android";

/** @extends React.Component */
export default class extends React.Component {
  static propTypes = {
    navigation: PropTypes.object
  };
  constructor(name, props) {
    super(props);
    NavigationActions.setNavigator(props.navigation);
    console.log(name);
    // Answers.logContentView(name);
  }
  componentDidCatch = (error, info) => {
    console.log(error + info);
    // Answers.logCustom(error, info);
  };
}
