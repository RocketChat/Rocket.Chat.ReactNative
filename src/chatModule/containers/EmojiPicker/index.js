import React, { Component } from "react";
import PropTypes from "prop-types";
import { ScrollView } from "react-native";
import ScrollableTabView from "react-native-scrollable-tab-view";
import map from "lodash/map";
import { emojify } from "react-emojione";
import TabBar from "./TabBar";
import EmojiCategory from "./EmojiCategory";
import styles from "./styles";
import categories from "./categories";
import database from "../../../main/ran-db/sqlite";
import { emojisByCategory } from "../../emojis";
import protectedFunction from "../../lib/methods/helpers/protectedFunction";

const scrollProps = {
  keyboardShouldPersistTaps: "always",
  keyboardDismissMode: "none"
};

export default class EmojiPicker extends Component {
  static propTypes = {
    baseUrl: PropTypes.string.isRequired,
    onEmojiSelected: PropTypes.func,
    tabEmojiStyle: PropTypes.object,
    emojisPerRow: PropTypes.number,
    width: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      frequentlyUsed: [],
      customEmojis: []
    };

    this.frequentlyUsed = null;
    this.frequentlyUsedToken = null;
    this.customEmojis = null;
    this.customEmojisToken = null;

    this.updateFrequentlyUsed = this.updateFrequentlyUsed.bind(this);
    this.updateCustomEmojis = this.updateCustomEmojis.bind(this);
  }

  getFrequentlyUsed = async () => {
    this.frequentlyUsed = await database.objects(
      "frequentlyUsedEmoji",
      `order by count ASC`
    );
    this.updateFrequentlyUsed();
  };
  getCustomEmojis = async () => {
    this.frequentlyUsed = await database.objects("customEmojis");
    this.updateCustomEmojis();
  };

  async componentDidMount() {
    requestAnimationFrame(() => this.setState({ show: true }));

    this.getFrequentlyUsed();
    if (!this.frequentlyUsedToken) {
      this.frequentlyUsedToken = PubSub.subscribe(
        "frequentlyUsedEmoji",
        this.getFrequentlyUsed
      );
    }
    this.getCustomEmojis();
    if (!this.customEmojisToken) {
      this.customEmojisToken = PubSub.subscribe(
        "customEmojis",
        this.getCustomEmojis
      );
    }
  }

  removeListener = token => {
    if (token) {
      PubSub.unsubscribe(token);
    }
  };

  componentWillUnmount() {
    this.removeListener(this.frequentlyUsedToken);
    this.removeListener(this.customEmojisToken);
  }

  onEmojiSelected(emoji) {
    if (emoji.isCustom) {
      const count = this._getFrequentlyUsedCount(emoji.content);
      this._addFrequentlyUsed({
        content: emoji.content,
        extension: emoji.extension,
        count,
        isCustom: true
      });
      this.props.onEmojiSelected(`:${emoji.content}:`);
    } else {
      const content = emoji;
      const count = this._getFrequentlyUsedCount(content);
      this._addFrequentlyUsed({ content, count, isCustom: false });
      const shortname = `:${emoji}:`;
      this.props.onEmojiSelected(
        emojify(shortname, { output: "unicode" }),
        shortname
      );
    }
  }

  _addFrequentlyUsed = protectedFunction(emoji => {
    database.create("frequentlyUsedEmoji", emoji, true);
  });
  _getFrequentlyUsedCount = content => {
    const emojiRow = this.frequentlyUsed.filter(
      item => item.content === content
    ); //this.frequentlyUsed.filtered("content == $0", content);
    return emojiRow.length ? emojiRow[0].count + 1 : 1;
  };
  updateFrequentlyUsed() {
    if (this.frequentlyUsed) {
      const frequentlyUsed = map(this.frequentlyUsed.slice(), item => {
        if (item.isCustom) {
          return item;
        }
        return emojify(`${item.content}`, { output: "unicode" });
      });
      this.setState({ frequentlyUsed });
    }
  }

  updateCustomEmojis() {
    if (this.customEmojis) {
      const customEmojis = map(this.customEmojis.slice(), item => ({
        content: item.name,
        extension: item.extension,
        isCustom: true
      }));
      this.setState({ customEmojis });
    }
  }

  renderCategory(category, i) {
    let emojis = [];
    if (i === 0) {
      emojis = this.state.frequentlyUsed;
    } else if (i === 1) {
      emojis = this.state.customEmojis;
    } else {
      emojis = emojisByCategory[category];
    }
    return (
      <EmojiCategory
        emojis={emojis}
        onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
        style={styles.categoryContainer}
        size={this.props.emojisPerRow}
        width={this.props.width}
        baseUrl={this.props.baseUrl}
      />
    );
  }

  render() {
    if (!this.state.show) {
      return null;
    }
    return (
      // <View style={styles.container}>
      <ScrollableTabView
        renderTabBar={() => <TabBar tabEmojiStyle={this.props.tabEmojiStyle} />}
        contentProps={scrollProps}
        style={styles.background}
      >
        {categories.tabs.map((tab, i) => (
          <ScrollView
            key={tab.category}
            tabLabel={tab.tabLabel}
            style={styles.background}
            {...scrollProps}
          >
            {this.renderCategory(tab.category, i)}
          </ScrollView>
        ))}
      </ScrollableTabView>
      // </View>
    );
  }
}
