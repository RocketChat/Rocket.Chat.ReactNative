import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../containers/Button';
import { TextInput } from 'react-native';
import {useState} from 'react'
import CreateChannelView from './CreateChannelView';
import { AICreateImageParamList } from 'stacks/types';
import { StackNavigationProp } from '@react-navigation/stack';
// Define the component props type if using TypeScript

interface IAICreateImageProps {
	navigation: StackNavigationProp<AICreateImageParamList, 'AICreateImageView'>;
	// route: RouteProp<ChatsStackParamList, 'CannedResponseDetail'>;
}



const AICreateImageView = ({ navigation }: IAICreateImageProps): JSX.Element => {
  // Define the handlePress function with correct syntax and navigation action
  const handlePress = () => {
    // Example navigation action; replace 'Destination' with your actual destination screen
    navigation.push('CreateChannelView');
  };
  const [text, onChangeText] = useState('');

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: 'your-image-url-here' }} style={styles.backgroundImage}>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>启示你的文字内容</Text>
          <TextInput 
          style={styles.subtitleText}> 
          placeholder={"智能感知设计，高级，细节美学"}
          value={text}
          onChangeText={onChangeText}
          </TextInput>
        </View>
        <Button title="立即生成" style={styles.button} styleText={styles.buttonText} onPress={CreateChannelView} />
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  textContainer: {
    marginTop: 100,
  },
  titleText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  subtitleText: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
  },
  button: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  buttonText: {
    fontSize: 18,
    color: '#000000',
  },
  iconBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default AICreateImageView;
