import React from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity
} from "react-native";
import PropTypes from "prop-types";
import Icon from "@expo/vector-icons/MaterialIcons";
import { connect } from "react-redux";
import i18n from "i18n-js";

import {
  selectServerRequest,
  serverInitAdd,
  serverFinishAdd
} from "../../actions/server";
// import I18n from '../../i18n';
import openLink from "../../utils/openLink";
import Button from "./Button";
import styles from "./styles";
import LoggedView from "../View";
import DeviceInfo from "../../utils/deviceInfo";

@connect(
  state => ({
    currentServer: state.server.server,
    adding: state.server.adding
  }),
  dispatch => ({
    initAdd: () => dispatch(serverInitAdd()),
    finishAdd: () => dispatch(serverFinishAdd()),
    selectServer: server => dispatch(selectServerRequest(server))
  })
)
/** @extends React.Component */
export default class OnboardingView extends LoggedView {
  static propTypes = {
    navigation: PropTypes.object,
    previousServer: PropTypes.string,
    adding: PropTypes.bool,
    selectServer: PropTypes.func.isRequired,
    currentServer: PropTypes.string,
    initAdd: PropTypes.func,
    finishAdd: PropTypes.func
  };

  constructor(props) {
    super("CreateChannelView", props);
  }

  componentDidMount() {
    const { previousServer, initAdd } = this.props;
    if (previousServer) {
      initAdd();
    }
  }

  componentWillUnmount() {
    const {
      selectServer,
      previousServer,
      currentServer,
      adding,
      finishAdd
    } = this.props;
    if (adding) {
      if (previousServer !== currentServer) {
        selectServer(previousServer);
      }
      finishAdd();
    }
  }

  close = () => {
    this.props.navigation.dismissModal();
  };

  connectServer = () => {
    this.props.navigation.navigate({
      routeName: "NewServerView",
      params: { backButtonTitle: "" }
    });
  };

  joinCommunity = () => {
    this.props.navigation.navigate({
      routeName: "NewServerView",
      params: {
        backButtonTitle: "",
        server: "https://open.rocket.chat"
      }
    });
  };

  createWorkspace = () => {
    openLink("https://cloud.rocket.chat/trial");
  };

  renderClose = () => {
    if (this.props.previousServer) {
      let top = 15;
      if (DeviceInfo.getBrand() === "Apple") {
        top = DeviceInfo.isNotch() ? 45 : 30;
      }
      return (
        <TouchableOpacity
          style={[styles.closeModal, { top }]}
          onPress={this.close}
        >
          <Icon name="close" size={30} color="#1D74F5" />
        </TouchableOpacity>
      );
    }
    return null;
  };

  render() {
    return (
      <SafeAreaView style={styles.container} testID="onboarding-view">
        <Image
          style={styles.onboarding}
          source={require("../../static/images/logo.png")}
        />
        <Text style={styles.title}>
          {i18n.t("ran.chat.Welcome_to_RocketChat")}
        </Text>
        <Text style={styles.subtitle}>
          {i18n.t("ran.chat.Open_Source_Communication")}
        </Text>
        <View style={styles.buttonsContainer}>
          <Button
            type="secondary"
            title={i18n.t("ran.chat.Connect_to_a_server")}
            icon={
              <Image
                source={{ uri: "connect_server" }}
                style={{ width: 30, height: 30 }}
              />
            }
            onPress={this.connectServer}
            testID="connect-server-button"
          />
          <Button
            type="secondary"
            title={i18n.t("ran.chat.Join_the_community")}
            subtitle="open.rocket.chat"
            icon={
              <Image
                source={{ uri: "logo_onboarding" }}
                style={{ width: 32, height: 27 }}
              />
            }
            onPress={this.joinCommunity}
            testID="join-community-button"
          />
          <Button
            type="primary"
            title={i18n.t("ran.chat.Create_a_new_workspace")}
            icon={
              <Image
                source={{ uri: "plus_onboarding" }}
                style={{ width: 24, height: 24 }}
              />
            }
            onPress={this.createWorkspace}
            testID="create-workspace-button"
          />
        </View>
        {this.renderClose()}
      </SafeAreaView>
    );
  }
}
