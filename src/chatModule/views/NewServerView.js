import React from "react";
import PropTypes from "prop-types";
import {
  Text,
  ScrollView,
  Keyboard,
  SafeAreaView,
  Image,
  Alert,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { connect } from "react-redux";
import Icon from "@expo/vector-icons/Ionicons";
import { logout } from "../actions/login";
import i18n from "i18n-js";

import { serverRequest } from "../actions/server";
import sharedStyles from "./Styles";
import scrollPersistTaps from "../utils/scrollPersistTaps";
import Button from "../containers/Button";
import TextInput from "../containers/TextInput";
import LoggedView from "./View";
import { scale, verticalScale, moderateScale } from "../utils/scaling";
import KeyboardView from "../presentation/KeyboardView";
import DeviceInfo from "../utils/deviceInfo";

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
    marginVertical: verticalScale(20),
    width: 210,
    height: 171
  },
  title: {
    alignSelf: "center",
    color: "#2F343D",
    fontSize: moderateScale(22),
    fontWeight: "bold",
    height: verticalScale(28),
    lineHeight: verticalScale(28)
  },
  inputContainer: {
    marginTop: scale(20),
    marginBottom: scale(20)
  },
  input: {
    color: "#9EA2A8",
    fontSize: 17,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16
  },
  backButton: {
    position: "absolute",
    paddingHorizontal: 9,
    left: 15
  }
});

const defaultServer = "https://open.rocket.chat";

@connect(
  state => ({
    connecting: state.server.connecting,
    failure: state.server.failure
  }),
  dispatch => ({
    connectServer: server => dispatch(serverRequest(server)),
    logout: () => dispatch(logout())
  })
)
/** @extends React.Component */
export default class NewServerView extends LoggedView {
  static propTypes = {
    navigator: PropTypes.object,
    server: PropTypes.string,
    connecting: PropTypes.bool.isRequired,
    failure: PropTypes.bool.isRequired,
    connectServer: PropTypes.func.isRequired
  };

  constructor(props) {
    super("NewServerView", props);
    this.state = {
      text: ""
    };
  }

  componentDidMount() {
    const { server } = this.props;
    if (server) {
      this.props.connectServer(server);
      this.setState({ text: server });
    } else {
      setTimeout(() => {
        this.input.focus();
      }, 600);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.failure && nextProps.failure !== this.props.failure) {
      Alert.alert(
        i18n.t("ran.chat.Oops"),
        i18n.t("ran.chat.The_URL_is_invalid")
      );
    }
  }

  onChangeText = text => {
    this.setState({ text });
  };

  submit = () => {
    const { previousServer } = this.props.navigation.state.params;

    if (this.state.text) {
      Keyboard.dismiss();
      if (previousServer) {
        if (this.state.text !== previousServer) {
          this.props.logout();
          this.props.connectServer(this.completeUrl(this.state.text));
        } else {
          this.props.navigation.navigate("RoomsListView", {});
        }
      } else {
        this.props.connectServer(this.completeUrl(this.state.text));
      }
    }
  };

  completeUrl = url => {
    url = url && url.trim();

    if (
      /^(\w|[0-9-_]){3,}$/.test(url) &&
      /^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(
        url
      ) === false
    ) {
      url = `${url}.rocket.chat`;
    }

    if (
      /^(https?:\/\/)?(((\w|[0-9])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(
        url
      )
    ) {
      if (/^localhost(:\d+)?/.test(url)) {
        url = `http://${url}`;
      } else if (/^https?:\/\//.test(url) === false) {
        url = `https://${url}`;
      }
    }

    return url.replace(/\/+$/, "");
  };

  renderBack = () => {
    let top = 15;
    if (DeviceInfo.getBrand() === "Apple") {
      top = DeviceInfo.isNotch() ? 45 : 30;
    }

    return (
      <TouchableOpacity
        style={[styles.backButton, { top }]}
        onPress={() => this.props.navigation.goBack()}
      >
        <Icon name="ios-arrow-back" size={30} color="#1D74F5" />
      </TouchableOpacity>
    );
  };

  render() {
    const { connecting } = this.props;
    const { text } = this.state;
    return (
      <KeyboardView
        contentContainerStyle={sharedStyles.container}
        keyboardVerticalOffset={128}
        key="login-view"
      >
        <ScrollView
          {...scrollPersistTaps}
          contentContainerStyle={sharedStyles.containerScrollView}
        >
          <SafeAreaView style={sharedStyles.container} testID="new-server-view">
            <Image style={styles.image} source={{ uri: "new_server" }} />
            <Text style={styles.title}>
              {i18n.t("ran.chat.Sign_in_your_server")}
            </Text>
            <TextInput
              inputRef={e => (this.input = e)}
              containerStyle={styles.inputContainer}
              inputStyle={StyleSheet.flatten(styles.input)}
              placeholder={defaultServer}
              value={text}
              returnKeyType="done"
              onChangeText={this.onChangeText}
              testID="new-server-view-input"
              onSubmitEditing={this.submit}
              clearButtonMode="while-editing"
            />
            <Button
              title={i18n.t("ran.chat.Connect")}
              type="primary"
              onPress={this.submit}
              disabled={text.length === 0}
              loading={connecting}
              testID="new-server-view-button"
            />
          </SafeAreaView>
        </ScrollView>
        {this.renderBack()}
      </KeyboardView>
    );
  }
}
