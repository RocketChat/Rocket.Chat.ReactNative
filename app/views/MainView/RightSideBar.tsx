import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const Sidebar = () => {
  return (
    <View style={styles.sidebar}>
      <TouchableOpacity style={styles.button}>
        <Icon name="bars" size={25} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <Icon name="star" size={25} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <Icon name="bell" size={25} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button}>
        <Icon name="gear" size={25} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 100, // Adjust top position based on your layout
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 300, // Adjust the height as per your UI design
  },
  button: {
    padding: 10,
    backgroundColor: 'white', // Set to your preference
    borderRadius: 50, // Circular button
    marginVertical: 5,
  },
});

export default Sidebar;