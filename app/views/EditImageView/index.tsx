import React, {  useState } from "react";
import { Button, Image, View, Text, LayoutRectangle, useWindowDimensions} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImagePickerOptions } from "expo-image-picker";
import {  useImageManipulator } from 'expo-image-manipulator';
import { useNavigation } from "@react-navigation/native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import ImagePicker from "../../lib/methods/helpers/ImagePicker/ImagePicker";
import { getPermissions } from '../../lib/methods/helpers/ImagePicker/getPermissions';
import { mapMediaResult } from '../../lib/methods/helpers/ImagePicker/mapMediaResult';
import Touch from "../../containers/Touch";


const EditImageView = () => {
    const {width} = useWindowDimensions();
    const [cropLimit, setCropLimit] = useState<LayoutRectangle>();
    const [imageSize, setImageSize] = useState<any>({width: 0, height: 0});
    const [editableImage, setEditableImage] = useState('');
    const [rotate, setRotate] = useState(0);    
    const navigation = useNavigation();
    const context = useImageManipulator(editableImage);

	const pickImage = async () => {
		try {
			const options: ImagePickerOptions = {
				exif: true,
				base64: true,
				quality: 0.8
			};
			await getPermissions('library');
			const response =  await ImagePicker.launchImageLibraryAsync(options);
			if (response.canceled) {
				return;
			}
			const [media] = mapMediaResult(response.assets);
            setEditableImage(media.path)
		} catch (error: any) {
            console.log(error)
		}
	};

    const onSaveImgage = async  () => {
        context.rotate(rotate);
        context.crop()
       const  imageRendered =  await context.renderAsync();
       const result = await imageRendered.saveAsync({
            format: SaveFormat.PNG
       });

       
    }

    const rotateLeft =  () => {
        setRotate(rotate + 90)
    };

    const rotateRight =  () => {
        setRotate(rotate - 90)
    };

    const borderColor = 'white'
    const sharedValueWidth = useSharedValue(width);
    const sharedValueHeight = useSharedValue(300);
    const top = useSharedValue(0);
    const bottom = useSharedValue(0);
    const left = useSharedValue(0);
    const right = useSharedValue(0);
    const prevTranslationXValue = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        width: sharedValueWidth.value,
        height: sharedValueHeight.value,
        transform: [{translateX: left.value}],
        backgroundColor: 'rgba(0, 0, 0, .4)', 
        position: 'absolute', 
        borderWidth: 2, 
        borderColor: 'blue',
        alignItems: 'center',
        justifyContent: 'center'
    }))

    const leftCenter = Gesture.Pan().onChange(e => {
        const newWidth = sharedValueWidth.value - (e.translationX - prevTranslationXValue.value)
        if(newWidth < 100) {
            return;
        }

        if(newWidth  > width) {
            sharedValueWidth.value = width;
            left.value = 0;
            return;
        } 


        sharedValueWidth.value = newWidth;
        prevTranslationXValue.value = e.translationX;
        left.value = e.translationX
    }).onFinalize(() => {prevTranslationXValue.value = 0})


    const rightCenter = Gesture.Pan().onChange(e => {
        const offset = e.translationX * -1 + prevTranslationXValue.value
        const newWidth = sharedValueWidth.value - offset

        if(newWidth < 100) {
            return;
        }

        if(newWidth  > width) {
            sharedValueWidth.value = width;
            return;
        } 
        sharedValueWidth.value = newWidth;
        prevTranslationXValue.value = e.translationX;
    }).onFinalize(() => {prevTranslationXValue.value = 0})

    return(  
        <SafeAreaView>
            
            <View style={{width, height: 300}}> 
                <Image  
                    onLayout={(e) => console.log(e.nativeEvent, e.target)}
                    source={{uri: editableImage}} 
                    style={{
                        flex: 1, 
                        transform: [{rotate: `${rotate}deg`}]
                    }}  
                />

                <Animated.View style={animatedStyle}>
                    
                    <View style={{
                        flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent'
                    }}
                    >
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor:'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                    </View>
                    <View style={{flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent'}}>
                       <GestureDetector gesture={leftCenter}>
                            <View style={{
                                borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'
                                }}
                            />
                       </GestureDetector>
                      
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor:'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />

                        <GestureDetector gesture={rightCenter}>  
                            <View style={{
                                borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'
                            }}
                            />
                        </GestureDetector>
                    </View>
                    <View style={{
                        flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent'
                    }}
                    >
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor:'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                    </View>
                </Animated.View>
            
            </View>


            <Button title='Open Gallery' onPress={pickImage} />
            <View style={{flexDirection: 'row'}}>
                <Touch>
                    <Text>Cancelar</Text>
                </Touch>
                 <Touch onPress={rotateLeft}>
                    <Text>RotLeft</Text>
                </Touch>
                <Touch onPress={()  => {}}>
                    <Text>RotLeft</Text>
                </Touch>

                 <Touch onPress={rotateRight}>
                    <Text>RotRight</Text>
                </Touch>

                <Touch>
                    <Text>Editar</Text>
                </Touch>

            </View>
        </SafeAreaView>
    )
}

export default EditImageView