/**
 * ModoalView for actions
 */

import React, { Component } from "react";
import { Modal, StyleSheet } from "react-native";
import PropTypes from "prop-types";

export default class ActionModal extends Component {
  state = {
    modalVisible: false
  };

  openModal() {
    this.setState({ modalVisible: true });
  }

  closeModal() {
    this.setState({ modalVisible: false });
  }

  render() {
    const { children } = this.props;
    return (
      <Modal
        visible={this.state.modalVisible}
        animationType={"slide"}
        onRequestClose={() => this.closeModal()}
      >
        {children}
      </Modal>
    );
  }
}

ActionModal.defaultProps = {};

ActionModal.propTypes = {
  children: PropTypes.node
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "grey"
  }
});
