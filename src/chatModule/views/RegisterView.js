import React from "react";
import PropTypes from "prop-types";
import { Keyboard, Text, View, ScrollView, SafeAreaView } from "react-native";
import { connect } from "react-redux";
import IonIcon from "@expo/vector-icons/Ionicons";
import i18n from "i18n-js";

import { registerSubmit, setUsernameSubmit } from "../actions/login";
import TextInput from "../containers/TextInput";
import Button from "../containers/Button";
import Loading from "../containers/Loading";
import KeyboardView from "../presentation/KeyboardView";
import styles from "./Styles";
import { showToast } from "../utils/info";
import scrollPersistTaps from "../utils/scrollPersistTaps";
import LoggedView from "./View";
// import I18n from "../i18n";

@connect(
  state => ({
    server: state.server.server,
    Accounts_NamePlaceholder: state.settings.Accounts_NamePlaceholder,
    Accounts_EmailOrUsernamePlaceholder:
      state.settings.Accounts_EmailOrUsernamePlaceholder,
    Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
    Accounts_RepeatPasswordPlaceholder:
      state.settings.Accounts_RepeatPasswordPlaceholder,
    login: state.login
  }),
  dispatch => ({
    registerSubmit: params => dispatch(registerSubmit(params)),
    setUsernameSubmit: params => dispatch(setUsernameSubmit(params))
  })
)
/** @extends React.Component */
export default class RegisterView extends LoggedView {
  static propTypes = {
    navigation: PropTypes.object,
    server: PropTypes.string,
    registerSubmit: PropTypes.func.isRequired,
    setUsernameSubmit: PropTypes.func,
    Accounts_UsernamePlaceholder: PropTypes.string,
    Accounts_NamePlaceholder: PropTypes.string,
    Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
    Accounts_PasswordPlaceholder: PropTypes.string,
    Accounts_RepeatPasswordPlaceholder: PropTypes.string,
    login: PropTypes.object
  };

  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam("title"),
      headerBackTitle: null,
      headerBackImage: (
        <IonIcon
          name="ios-arrow-back"
          style={{ marginHorizontal: 15 }}
          size={22}
          color="#4674F1"
        />
      )
    };
  };

  constructor(props) {
    super("RegisterView", props);
    this.state = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      username: ""
    };
  }

  valid() {
    const { name, email, password, confirmPassword } = this.state;
    return (
      name.trim() &&
      email.trim() &&
      password &&
      confirmPassword &&
      password === confirmPassword
    );
  }

  invalidEmail() {
    return this.props.login.failure &&
      /Email/.test(this.props.login.error.reason)
      ? this.props.login.error
      : {};
  }

  submit = () => {
    const { name, email, password, code } = this.state;
    if (!this.valid()) {
      showToast(i18n.t("ran.chat.Some_field_is_invalid_or_empty"));
      return;
    }

    this.props.registerSubmit({
      name,
      email,
      pass: password,
      code
    });
    Keyboard.dismiss();
  };

  usernameSubmit = () => {
    const { username } = this.state;
    if (!username) {
      showToast(i18n.t("ran.chat.Username_is_empty"));
      return;
    }

    this.props.setUsernameSubmit({ username });
    Keyboard.dismiss();
  };

  termsService = () => {
    this.props.navigation.navigate("TermsServiceView", {
      title: i18n.t("ran.chat.Terms_of_Service")
    });
  };

  privacyPolicy = () => {
    this.props.navigation.navigate("PrivacyPolicyView", {
      title: i18n.t("ran.chat.Privacy_Policy")
    });
  };

  _renderRegister() {
    if (this.props.login.token) {
      return null;
    }
    return (
      <View>
        <TextInput
          inputRef={e => {
            this.name = e;
          }}
          label={this.props.Accounts_NamePlaceholder || i18n.t("ran.chat.Name")}
          placeholder={
            this.props.Accounts_NamePlaceholder || i18n.t("ran.chat.Name")
          }
          returnKeyType="next"
          iconLeft="account"
          onChangeText={name => this.setState({ name })}
          onSubmitEditing={() => {
            this.email.focus();
          }}
          testID="register-view-name"
        />
        <TextInput
          inputRef={e => {
            this.email = e;
          }}
          label={
            this.props.Accounts_EmailOrUsernamePlaceholder ||
            i18n.t("ran.chat.Email")
          }
          placeholder={
            this.props.Accounts_EmailOrUsernamePlaceholder ||
            i18n.t("ran.chat.Email")
          }
          returnKeyType="next"
          keyboardType="email-address"
          iconLeft="email"
          onChangeText={email => this.setState({ email })}
          onSubmitEditing={() => {
            this.password.focus();
          }}
          error={this.invalidEmail()}
          testID="register-view-email"
        />
        <TextInput
          inputRef={e => {
            this.password = e;
          }}
          label={
            this.props.Accounts_PasswordPlaceholder ||
            i18n.t("ran.chat.Password")
          }
          placeholder={
            this.props.Accounts_PasswordPlaceholder ||
            i18n.t("ran.chat.Password")
          }
          returnKeyType="next"
          iconLeft="key-variant"
          secureTextEntry
          onChangeText={password => this.setState({ password })}
          onSubmitEditing={() => {
            this.confirmPassword.focus();
          }}
          testID="register-view-password"
        />
        <TextInput
          inputRef={e => {
            this.confirmPassword = e;
          }}
          inputStyle={
            this.state.password &&
            this.state.confirmPassword &&
            this.state.confirmPassword !== this.state.password
              ? { borderColor: "red" }
              : {}
          }
          label={
            this.props.Accounts_RepeatPasswordPlaceholder ||
            i18n.t("ran.chat.Repeat_Password")
          }
          placeholder={
            this.props.Accounts_RepeatPasswordPlaceholder ||
            i18n.t("ran.chat.Repeat_Password")
          }
          returnKeyType="done"
          iconLeft="key-variant"
          secureTextEntry
          onChangeText={confirmPassword => this.setState({ confirmPassword })}
          onSubmitEditing={this.submit}
          testID="register-view-repeat-password"
        />

        <View style={styles.alignItemsFlexStart}>
          <Text style={styles.loginTermsText}>
            {i18n.t("ran.chat.By_proceeding_you_are_agreeing")}
            <Text style={styles.link} onPress={this.termsService}>
              {i18n.t("ran.chat.Terms_of_Service")}
            </Text>
            {i18n.t("ran.chat.and")}
            <Text style={styles.link} onPress={this.privacyPolicy}>
              {i18n.t("ran.chat.Privacy_Policy")}
            </Text>
          </Text>
          <Button
            title={i18n.t("ran.chat.Register")}
            type="primary"
            onPress={this.submit}
            testID="register-view-submit"
          />
        </View>
      </View>
    );
  }

  _renderUsername() {
    if (!this.props.login.token) {
      return null;
    }
    return (
      <View>
        <TextInput
          inputRef={e => {
            this.username = e;
          }}
          label={
            this.props.Accounts_UsernamePlaceholder ||
            i18n.t("ran.chat.Username")
          }
          placeholder={
            this.props.Accounts_UsernamePlaceholder ||
            i18n.t("ran.chat.Username")
          }
          returnKeyType="done"
          iconLeft="at"
          onChangeText={username => this.setState({ username })}
          onSubmitEditing={() => {
            this.usernameSubmit();
          }}
          testID="register-view-username"
        />

        <View style={styles.alignItemsFlexStart}>
          <Button
            title={i18n.t("ran.chat.Register")}
            type="primary"
            onPress={this.usernameSubmit}
            testID="register-view-submit-username"
          />
        </View>
      </View>
    );
  }

  render() {
    return (
      <KeyboardView contentContainerStyle={styles.container}>
        <ScrollView
          {...scrollPersistTaps}
          contentContainerStyle={styles.containerScrollView}
        >
          <SafeAreaView style={styles.container} testID="register-view">
            <Text style={[styles.loginText, styles.loginTitle]}>
              {i18n.t("ran.chat.Sign_Up")}
            </Text>
            {this._renderRegister()}
            {this._renderUsername()}
            {this.props.login.failure ? (
              <Text style={styles.error} testID="register-view-error">
                {this.props.login.error.reason}
              </Text>
            ) : null}
            <Loading visible={this.props.login.isFetching} />
          </SafeAreaView>
        </ScrollView>
      </KeyboardView>
    );
  }
}
