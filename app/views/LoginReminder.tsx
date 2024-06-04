import React from 'react';
import { Modal, View, Text, Button, StyleSheet , Dimensions} from 'react-native';
import Navigation from '../lib/navigation/appNavigation';
import { useState } from 'react';

interface LoginReminderModalProps {
  visible: boolean;
  onClose: () => void;
}

const LoginReminder: React.FC<LoginReminderModalProps> = ({ visible, onClose }) => {
  const onLoginPress = () => {
    Navigation.navigate('LoginView');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Please log in to continue</Text>
          <View style={styles.buttonContainer}>
            <Button title="Login" onPress={onLoginPress} />
            <Button title="Close" onPress={onClose} color="red" />
          </View>
        </View>
      </View>
    </Modal>
  );
};
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    width: width
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white', // Set the background color to white
    // borderRadius: 10, // Optional: Add rounded corners
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width,
  },
});

export default LoginReminder;
