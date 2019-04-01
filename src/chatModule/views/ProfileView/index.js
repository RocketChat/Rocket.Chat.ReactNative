import React from "react";
import PropTypes from "prop-types";
import {
  View,
  ScrollView,
  SafeAreaView,
  Keyboard,
  TouchableOpacity
} from "react-native";
import { connect } from "react-redux";
import Dialog from "react-native-dialog";
import SHA256 from "js-sha256";
import Icon from "react-native-vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import RNPickerSelect from "react-native-picker-select";
import { ImagePicker, Permissions } from "expo";
import i18n from "i18n-js";

import LoggedView from "../View";
import KeyboardView from "../../presentation/KeyboardView";
import sharedStyles from "../Styles";
import styles from "./styles";
import scrollPersistTaps from "../../utils/scrollPersistTaps";
import { showErrorAlert, showToast } from "../../utils/info";
import RocketChat from "../../lib/rocketchat";
import RCTextInput from "../../containers/TextInput";
import Loading from "../../containers/Loading";
import log from "../../utils/log";
import Button from "../../containers/Button";
import Avatar from "../../containers/Avatar";
import Touch from "../../utils/touch";

@connect(state => ({
  user: {
    name: state.login.user && state.login.user.name,
    username: state.login.user && state.login.user.username,
    customFields: state.login.user && state.login.user.customFields,
    emails: state.login.user && state.login.user.emails
  },
  Accounts_CustomFields: state.settings.Accounts_CustomFields,
  baseUrl: state.settings.Site_Url || state.server ? state.server.server : ""
}))
/** @extends React.Component */
export default class ProfileView extends LoggedView {
  static propTypes = {
    baseUrl: PropTypes.string,
    navigation: PropTypes.object,
    user: PropTypes.object,
    Accounts_CustomFields: PropTypes.string
  };

  constructor(props) {
    super("ProfileView", props);
    this.state = {
      showPasswordAlert: false,
      saving: false,
      name: null,
      username: null,
      email: null,
      newPassword: null,
      typedPassword: null,
      avatarUrl: null,
      avatar: {},
      avatarSuggestions: {},
      customFields: {}
    };
  }

  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam("title"),
      headerLeft: (
        <TouchableOpacity
          style={{ marginHorizontal: 15 }}
          onPress={() => {
            navigation.toggleDrawer();
          }}
        >
          <Feather name="settings" size={20} color="#4674F1" />
        </TouchableOpacity>
      )
    };
  };

  async componentDidMount() {
    this.init();

    // this.props.navigator.setDrawerEnabled({
    //   side: "left",
    //   enabled: true
    // });

    try {
      const result = await RocketChat.getAvatarSuggestion();
      this.setState({ avatarSuggestions: result });
    } catch (e) {
      log("getAvatarSuggestion", e);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.user !== nextProps.user) {
      this.init(nextProps.user);
    }
  }

  setAvatar = avatar => {
    this.setState({ avatar });
  };

  init = user => {
    const { name, username, emails, customFields } = user || this.props.user;
    this.setState({
      name,
      username,
      email: emails ? emails[0].address : null,
      newPassword: null,
      typedPassword: null,
      avatarUrl: null,
      avatar: {},
      customFields: customFields || {}
    });
  };

  formIsChanged = () => {
    const {
      name,
      username,
      email,
      newPassword,
      avatar,
      customFields
    } = this.state;
    const { user } = this.props;
    let customFieldsChanged = false;

    const customFieldsKeys = Object.keys(customFields);
    if (customFieldsKeys.length) {
      customFieldsKeys.forEach(key => {
        if (user.customFields[key] !== customFields[key]) {
          customFieldsChanged = true;
        }
      });
    }

    return !(
      user.name === name &&
      user.username === username &&
      !newPassword &&
      (user.emails && user.emails[0].address === email) &&
      !avatar.data &&
      !customFieldsChanged
    );
  };

  closePasswordAlert = () => {
    this.setState({ showPasswordAlert: false });
  };

  handleError = (e, func, action) => {
    if (e && e.error && e.error !== 500) {
      if (e.details && e.details.timeToReset) {
        return showErrorAlert(i18n.t("ran.chat.error-too-many-requests"));
      }
      return showErrorAlert(i18n.t(`ran.chat.${e.error}`));
    }
    showErrorAlert(
      i18n.t(`ran.chat.There_was_an_error_while_${action}_action`)
    );
    log(func, e);
  };

  submit = async () => {
    Keyboard.dismiss();

    if (!this.formIsChanged()) {
      return;
    }

    this.setState({ saving: true, showPasswordAlert: false });

    const {
      name,
      username,
      email,
      newPassword,
      typedPassword,
      avatar,
      customFields
    } = this.state;
    const { user, baseUrl } = this.props;
    const params = {};

    // Name
    if (user.name !== name) {
      params.realname = name;
    }

    // Username
    if (user.username !== username) {
      params.username = username;
    }

    // Email
    if (user.emails && user.emails[0].address !== email) {
      params.email = email;
    }

    // newPassword
    if (newPassword) {
      params.newPassword = newPassword;
    }

    // typedPassword
    if (typedPassword) {
      params.typedPassword = SHA256(typedPassword);
    }

    const requirePassword = !!params.email || newPassword;
    if (requirePassword && !params.typedPassword) {
      return this.setState({ showPasswordAlert: true, saving: false });
    }

    try {
      if (avatar.url) {
        try {
          await RocketChat.setAvatarFromService(avatar);
        } catch (e) {
          this.setState({
            saving: false,
            typedPassword: null,
            avatar: `${baseUrl}/avatar/${user.username}?time=${new Date()}`
          });
          return setTimeout(
            () =>
              this.handleError(e, "setAvatarFromService", "changing_avatar"),
            300
          );
        }
      }

      await RocketChat.saveUserProfile(params, customFields);
      this.setState({ saving: false });
      setTimeout(() => {
        showToast(i18n.t("ran.chat.Profile_saved_successfully"));
        this.init();
      }, 300);
    } catch (e) {
      this.setState({ saving: false, typedPassword: null });
      setTimeout(() => {
        this.handleError(e, "saveUserProfile", "saving_profile");
      }, 300);
    }
  };

  resetAvatar = async () => {
    try {
      await RocketChat.resetAvatar();
      showToast(i18n.t("ran.chat.Avatar_changed_successfully"));
      this.init();
    } catch (e) {
      this.handleError(e, "resetAvatar", "changing_avatar");
    }
  };

  cameraRollPermission = async () => {
    const response = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    return response.status === "granted";
  };

  pickImage = async () => {
    try {
      const cameraRollPermission = await this.cameraRollPermission();
      if (!cameraRollPermission) {
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        base64: true
      });

      console.log(result);

      if (!result.cancelled) {
        this.setAvatar({
          url: result.uri,
          data: `data:image/jpeg;base64,${result.base64}`,
          service: "upload"
        });
      }
    } catch (error) {
      console.warn(error);
    }
  };

  renderAvatarButton = ({ key, child, onPress, disabled = false }) => (
    <Touch
      key={key}
      testID={key}
      onPress={onPress}
      underlayColor="rgba(255, 255, 255, 0.5)"
      activeOpacity={0.3}
      disabled={disabled}
    >
      <View style={[styles.avatarButton, { opacity: disabled ? 0.5 : 1 }]}>
        {child}
      </View>
    </Touch>
  );

  renderAvatarButtons = () => (
    <View style={styles.avatarButtons}>
      {this.renderAvatarButton({
        child: (
          <Avatar
            text={this.props.user.username}
            size={50}
            baseUrl={this.props.baseUrl}
            forceInitials
          />
        ),
        onPress: () => this.resetAvatar(),
        key: "profile-view-reset-avatar"
      })}
      {this.renderAvatarButton({
        child: <Icon name="file-upload" size={30} />,
        onPress: () => this.pickImage(),
        key: "profile-view-upload-avatar"
      })}
      {this.renderAvatarButton({
        child: <Icon name="link" size={30} />,
        onPress: () =>
          this.setAvatar({
            url: this.state.avatarUrl,
            data: this.state.avatarUrl,
            service: "url"
          }),
        disabled: !this.state.avatarUrl,
        key: "profile-view-avatar-url-button"
      })}
      {Object.keys(this.state.avatarSuggestions).map(service => {
        const { url, blob, contentType } = this.state.avatarSuggestions[
          service
        ];
        return this.renderAvatarButton({
          key: `profile-view-avatar-${service}`,
          child: <Avatar avatar={url} size={50} baseUrl={this.props.baseUrl} />,
          onPress: () =>
            this.setAvatar({
              url,
              data: blob,
              service,
              contentType
            })
        });
      })}
    </View>
  );

  renderCustomFields = () => {
    const { customFields } = this.state;
    if (!this.props.Accounts_CustomFields) {
      return null;
    }
    const parsedCustomFields = JSON.parse(this.props.Accounts_CustomFields);
    return Object.keys(parsedCustomFields).map((key, index, array) => {
      if (parsedCustomFields[key].type === "select") {
        const options = parsedCustomFields[key].options.map(option => ({
          label: option,
          value: option
        }));
        return (
          <RNPickerSelect
            key={key}
            items={options}
            onValueChange={value => {
              const newValue = {};
              newValue[key] = value;
              this.setState({
                customFields: { ...this.state.customFields, ...newValue }
              });
            }}
            value={customFields[key]}
          >
            <RCTextInput
              inputRef={e => {
                this[key] = e;
              }}
              label={key}
              placeholder={key}
              value={customFields[key]}
              testID="settings-view-language"
            />
          </RNPickerSelect>
        );
      }

      return (
        <RCTextInput
          inputRef={e => {
            this[key] = e;
          }}
          key={key}
          label={key}
          placeholder={key}
          value={customFields[key]}
          onChangeText={value => {
            const newValue = {};
            newValue[key] = value;
            this.setState({
              customFields: { ...this.state.customFields, ...newValue }
            });
          }}
          onSubmitEditing={() => {
            if (array.length - 1 > index) {
              return this[array[index + 1]].focus();
            }
            this.avatarUrl.focus();
          }}
        />
      );
    });
  };

  render() {
    const {
      name,
      username,
      email,
      newPassword,
      avatar,
      avatarUrl,
      customFields
    } = this.state;
    return (
      <KeyboardView
        contentContainerStyle={sharedStyles.container}
        keyboardVerticalOffset={128}
      >
        <ScrollView
          contentContainerStyle={sharedStyles.containerScrollView}
          testID="profile-view-list"
          {...scrollPersistTaps}
        >
          <SafeAreaView style={sharedStyles.container} testID="profile-view">
            <View style={styles.avatarContainer} testID="profile-view-avatar">
              <Avatar
                text={username}
                avatar={avatar && avatar.url}
                size={100}
                baseUrl={this.props.baseUrl}
              />
            </View>
            <RCTextInput
              inputRef={e => {
                this.name = e;
              }}
              label={i18n.t("ran.chat.Name")}
              placeholder={i18n.t("ran.chat.Name")}
              value={name}
              onChangeText={value => this.setState({ name: value })}
              onSubmitEditing={() => {
                this.username.focus();
              }}
              testID="profile-view-name"
            />
            <RCTextInput
              inputRef={e => {
                this.username = e;
              }}
              label={i18n.t("ran.chat.Username")}
              placeholder={i18n.t("ran.chat.Username")}
              value={username}
              onChangeText={value => this.setState({ username: value })}
              onSubmitEditing={() => {
                this.email.focus();
              }}
              testID="profile-view-username"
            />
            <RCTextInput
              inputRef={e => {
                this.email = e;
              }}
              label={i18n.t("ran.chat.Email")}
              placeholder={i18n.t("ran.chat.Email")}
              value={email}
              onChangeText={value => this.setState({ email: value })}
              onSubmitEditing={() => {
                this.newPassword.focus();
              }}
              testID="profile-view-email"
            />
            <RCTextInput
              inputRef={e => {
                this.newPassword = e;
              }}
              label={i18n.t("ran.chat.New_Password")}
              placeholder={i18n.t("ran.chat.New_Password")}
              value={newPassword}
              onChangeText={value => this.setState({ newPassword: value })}
              onSubmitEditing={() => {
                if (Object.keys(customFields).length) {
                  return this[Object.keys(customFields)[0]].focus();
                }
                this.avatarUrl.focus();
              }}
              secureTextEntry
              testID="profile-view-new-password"
            />
            {this.renderCustomFields()}
            <RCTextInput
              inputRef={e => {
                this.avatarUrl = e;
              }}
              label={i18n.t("ran.chat.Avatar_Url")}
              placeholder={i18n.t("ran.chat.Avatar_Url")}
              value={avatarUrl}
              onChangeText={value => this.setState({ avatarUrl: value })}
              onSubmitEditing={this.submit}
              testID="profile-view-avatar-url"
            />
            {this.renderAvatarButtons()}
            <View style={sharedStyles.alignItemsFlexStart}>
              <Button
                title={i18n.t("ran.chat.Save_Changes")}
                type="primary"
                onPress={this.submit}
                disabled={!this.formIsChanged()}
                testID="profile-view-submit"
              />
            </View>
            <Loading visible={this.state.saving} />
            <Dialog.Container visible={this.state.showPasswordAlert}>
              <Dialog.Title>
                {i18n.t("ran.chat.Please_enter_your_password")}
              </Dialog.Title>
              <Dialog.Description>
                {i18n.t(
                  "ran.chat.For_your_security_you_must_enter_your_current_password_to_continue"
                )}
              </Dialog.Description>
              <Dialog.Input
                onChangeText={value => this.setState({ typedPassword: value })}
                secureTextEntry
                testID="profile-view-typed-password"
                style={styles.dialogInput}
              />
              <Dialog.Button
                label={i18n.t("ran.chat.Cancel")}
                onPress={this.closePasswordAlert}
              />
              <Dialog.Button
                label={i18n.t("ran.chat.Save")}
                onPress={this.submit}
              />
            </Dialog.Container>
          </SafeAreaView>
        </ScrollView>
      </KeyboardView>
    );
  }
}
