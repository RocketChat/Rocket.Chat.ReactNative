import React, {  useState } from "react";
import { Button, Image, View, Text, LayoutRectangle, useWindowDimensions} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImagePickerOptions } from "expo-image-picker";
import {  useImageManipulator } from 'expo-image-manipulator';
import { useNavigation } from "@react-navigation/native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { clamp, useAnimatedStyle, useSharedValue, withClamp } from "react-native-reanimated";

import ImagePicker from "../../lib/methods/helpers/ImagePicker/ImagePicker";
import { getPermissions } from '../../lib/methods/helpers/ImagePicker/getPermissions';
import { mapMediaResult } from '../../lib/methods/helpers/ImagePicker/mapMediaResult';
import Touch from "../../containers/Touch";


const EditImageView = () => {
    const [crop, setCrop] = useState(false);
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
    const {width} = useWindowDimensions();
    const height = 300;
    const sharedValueWidth = useSharedValue(width);
    const sharedValueHeight = useSharedValue(height);
    const top = useSharedValue(0);
    const left = useSharedValue(0);
    const prevTranslationXValue = useSharedValue(0);
    const prevTranslationYValue = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        width: sharedValueWidth.value,
        height: sharedValueHeight.value,
        transform: [{translateX: left.value}, {translateY: top.value}],
        backgroundColor: 'rgba(0, 0, 0, .4)', 
        position: 'absolute', 
        borderWidth: 2, 
        borderColor: 'blue',
        alignItems: 'center',
        justifyContent: 'center'
    }))

    const leftCenter = Gesture.Pan().onChange(e => {
        const offset = e.translationX - prevTranslationXValue.value;
        const newWidth = clamp(sharedValueWidth.value - (e.translationX - prevTranslationXValue.value), 100, width) 
        const newLeft =  clamp(left.value + offset, 0, width - newWidth) ;

        if(newWidth > 100) {
            left.value = newLeft;
            if(newLeft > 0) {
                sharedValueWidth.value = newWidth > width * 0.99 ? width: newWidth;
            }
        }
        prevTranslationXValue.value = e.translationX;
    }).onFinalize(() => {
        prevTranslationXValue.value = 0; 
      
    })

    const rightCenter = Gesture.Pan().onChange(e => {
        const offset = (e.translationX * -1) + prevTranslationXValue.value;
        const newWidth = clamp( sharedValueWidth.value - offset, 100, width)
        if(newWidth + left.value < width) {
             sharedValueWidth.value = newWidth > width * 0.99 ? width: newWidth;
        }
        prevTranslationXValue.value = e.translationX;
    }).onFinalize(() => {prevTranslationXValue.value = 0})

    const topCenter = Gesture.Pan().onChange(e => {
        const offset = e.translationY - prevTranslationYValue.value;
        const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationYValue.value), 30, height);
        const newTop =  clamp(top.value + offset, 0, height - newHeight);

        if(newHeight > 30) {
            top.value = newTop;
            if(newTop > 0) {
                sharedValueHeight.value = newHeight > height * 0.99 ? height: newHeight;
            }
        }

        prevTranslationYValue.value = e.translationY;

    }).onFinalize(() => { prevTranslationYValue.value = 0})

   
    const bottomCenter = Gesture.Pan().onChange(e => {
        const offset = (e.translationY * -1) + prevTranslationYValue.value;
        const newHeight = clamp( sharedValueHeight.value - offset, 30, height)
        if(newHeight + top.value < height) {
             sharedValueHeight.value = newHeight > height * 0.99 ? height: newHeight;
        }
        prevTranslationYValue.value = e.translationY;
    }).onFinalize(() => {prevTranslationYValue.value = 0})

    return(  
        <SafeAreaView>
            
            <View style={{width, height: 300}}> 
                <Image  
                    source={{uri: editableImage}} 
                    style={{
                        flex: 1, 
                        transform: [{rotate: `${rotate}deg`}]
                    }}  
                />

                {
                    editableImage && crop
                    ?
                <Animated.View style={animatedStyle}>               
                    <View style={{
                        flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent'
                    }}
                    >
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                        <GestureDetector gesture={topCenter}>
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor:'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                        </GestureDetector>
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
                        <GestureDetector gesture={bottomCenter}>
                            <View style={{
                                borderColor, borderWidth: 1, backgroundColor:'transparent', flex: 1 / 3, height: '100%'
                            }}
                            />
                        </GestureDetector>
                        <View style={{
                            borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'
                        }}
                        />
                    </View>
                </Animated.View>
                    : null
                }

            
            </View>


            <Button title='Open Gallery' onPress={pickImage} />
            <View style={{flexDirection: 'column', gap: 20}}>
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

                 <Touch onPress={() => setCrop(true)}>
                    <Text>crop</Text>
                </Touch>


                <Touch>
                    <Text>Editar</Text>
                </Touch>

            </View>
        </SafeAreaView>
    )
}

export default EditImageView