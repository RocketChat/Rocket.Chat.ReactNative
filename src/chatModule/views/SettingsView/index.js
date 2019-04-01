import React from "react";
import PropTypes from "prop-types";
import { View, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { connect } from "react-redux";
import Feather from "@expo/vector-icons/Feather";
import i18n from "i18n-js";

import LoggedView from "../View";
import RocketChat from "../../lib/rocketchat";
import KeyboardView from "../../presentation/KeyboardView";
import sharedStyles from "../Styles";
import RCTextInput from "../../containers/TextInput";
import scrollPersistTaps from "../../utils/scrollPersistTaps";
import Button from "../../containers/Button";
import Loading from "../../containers/Loading";
import { showErrorAlert, showToast } from "../../utils/info";
import log from "../../utils/log";
import { setUser } from "../../actions/login";

@connect(
  state => ({
    userLanguage: state.login.user && state.login.user.language
  }),
  dispatch => ({
    setUser: params => dispatch(setUser(params))
  })
)
/** @extends React.Component */
export default class SettingsView extends LoggedView {
  static propTypes = {
    navigation: PropTypes.object,
    userLanguage: PropTypes.string,
    setUser: PropTypes.func
  };

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

  constructor(props) {
    super("SettingsView", props);
    this.state = {
      placeholder: {},
      language: props.userLanguage ? props.userLanguage : "en",
      languages: [
        {
          label: "English",
          value: "en"
        },
        {
          label: "Simple Chinese",
          value: "cn_zh"
        }
      ],
      saving: false
    };
  }

  getLabel = language => {
    const { languages } = this.state;
    const l = languages.find(i => i.value === language);
    if (l && l.label) {
      return l.label;
    }
    return null;
  };

  formIsChanged = () => {
    const { language } = this.state;
    return !(this.props.userLanguage === language);
  };

  submit = async () => {
    this.setState({ saving: true });

    const { language } = this.state;
    const { userLanguage } = this.props;

    if (!this.formIsChanged()) {
      return;
    }

    const params = {};

    // language
    if (userLanguage !== language) {
      params.language = language;
    }

    try {
      await RocketChat.saveUserPreferences(params);
      this.props.setUser({ language: params.language });

      this.setState({ saving: false });
      setTimeout(() => {
        showToast(i18n.t("ran.chat.Preferences_saved"));

        if (params.language) {
          this.props.navigation.setParams({
            title: i18n.t("ran.chat.Settings")
          });
        }
      }, 300);
    } catch (e) {
      this.setState({ saving: false });
      setTimeout(() => {
        if (e && e.error) {
          return showErrorAlert(e.error, e.details);
        }
        showErrorAlert(
          i18n.t("ran.chat.There_was_an_error_while_action"),
          i18n.t("ran.chat.saving_preferences")
        );
        log("saveUserPreferences", e);
      }, 300);
    }
  };

  render() {
    console.log("render SettingsView");
    const { language, languages, placeholder } = this.state;
    return (
      <KeyboardView
        contentContainerStyle={sharedStyles.container}
        keyboardVerticalOffset={128}
      >
        <ScrollView
          contentContainerStyle={sharedStyles.containerScrollView}
          testID="settings-view-list"
          {...scrollPersistTaps}
        >
          <SafeAreaView style={sharedStyles.container} testID="settings-view">
            <RNPickerSelect
              items={languages}
              onValueChange={value => {
                this.setState({ language: value });
              }}
              value={language}
              placeholder={placeholder}
            >
              <RCTextInput
                inputRef={e => {
                  this.name = e;
                }}
                label={i18n.t("ran.chat.Language")}
                placeholder={i18n.t("ran.chat.Language")}
                value={this.getLabel(language)}
                testID="settings-view-language"
              />
            </RNPickerSelect>
            <View style={sharedStyles.alignItemsFlexStart}>
              <Button
                title={i18n.t("ran.chat.Save_Changes")}
                type="primary"
                onPress={this.submit}
                disabled={!this.formIsChanged()}
                testID="settings-view-button"
              />
            </View>
            <Loading visible={this.state.saving} />
          </SafeAreaView>
        </ScrollView>
      </KeyboardView>
    );
  }
}
