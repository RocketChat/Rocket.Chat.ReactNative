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

    
    const topLeft = Gesture.Pan().onChange(e => {
        const verticalOffset = e.translationY - prevTranslationYValue.value;
        const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationYValue.value), 30, height);
        const newTop =  clamp(top.value + verticalOffset, 0, height - newHeight);
        
        const horizontalOffset = e.translationX - prevTranslationXValue.value;
        const newWidth = clamp(sharedValueWidth.value - horizontalOffset, 100, width);
        const newLeft =  clamp(left.value + horizontalOffset, 0, width - newWidth);
       
        if(newTop > 0) {
            sharedValueHeight.value = newHeight > height * 0.999 ? height: newHeight;
            top.value = newHeight > height * 0.999 ? 0 : newTop;

        }

        if(newLeft > 0) {
            sharedValueWidth.value = newWidth > width * 0.999 ? width: newWidth;
            left.value =  newWidth > width * 0.999 ? 0 : newLeft;
        }
    
        prevTranslationYValue.value = e.translationY;
        prevTranslationXValue.value = e.translationX;

    }).onFinalize(() => { 
        prevTranslationYValue.value = 0
        prevTranslationXValue.value = 0
    })
    const topCenter = Gesture.Pan().onChange(e => {
        const offset = e.translationY - prevTranslationYValue.value;
        const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationYValue.value), 30, height);
        const newTop =  clamp(top.value + offset, 0, height - newHeight);

        if(newTop > 0) {
            sharedValueHeight.value = newHeight;
            top.value =  newTop;

        }

        prevTranslationYValue.value = e.translationY;

    }).onFinalize(() => { prevTranslationYValue.value = 0})
    const topRight = Gesture.Pan().onChange(e => {
        const verticalOffset = e.translationY - prevTranslationYValue.value;
        const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationYValue.value), 30, height);
        const newTop =  clamp(top.value + verticalOffset, 0, height - newHeight);
        const horizontalOffset = (e.translationX * -1) + prevTranslationXValue.value;
        const newWidth = clamp( sharedValueWidth.value - horizontalOffset, 100, width);

        if(newTop > 0) {
            sharedValueHeight.value = newHeight > height * 0.999 ? height: newHeight;
            top.value = newHeight > height * 0.999 ? 0 : newTop;
        }
    
        if(newWidth + left.value < width) {
            sharedValueWidth.value = newWidth > width * 0.999 ? width: newWidth;
        }

        prevTranslationYValue.value = e.translationY;
        prevTranslationXValue.value = e.translationX;
    }).onFinalize(() => {
        prevTranslationYValue.value = 0
        prevTranslationXValue.value = 0
    });


    const leftCenter = Gesture.Pan().onChange(e => {
        const offset = e.translationX - prevTranslationXValue.value;
        const newWidth = clamp(sharedValueWidth.value - (e.translationX - prevTranslationXValue.value), 100, width) 
        const newLeft =  clamp(left.value + offset, 0, width - newWidth) ;

        if(newLeft > 0) {
            sharedValueWidth.value = newWidth > width * 0.999 ? width: newWidth;
            left.value =  newWidth > width * 0.999 ? 0 : newLeft;
        }
    
        prevTranslationXValue.value = e.translationX;
    }).onFinalize(() => {
        prevTranslationXValue.value = 0; 
      
    })
     const moveGrid = Gesture.Pan().onChange(e => {
        const offset = e.translationX - prevTranslationXValue.value;
        const verticalOffset = e.translationY - prevTranslationYValue.value;

        const newLeft =  clamp((left.value + offset)/2, 0, width - sharedValueWidth.value);
        const newTop =  clamp((top.value + verticalOffset)/2, 0, height - sharedValueHeight.value);

        if(sharedValueWidth.value < width) {
            left.value = newLeft
        }

        if(sharedValueHeight.value < height) {
            top.value = newTop
        }

    }).onFinalize(() => {
        prevTranslationXValue.value = 0; 
        prevTranslationYValue.value = 0;
    })
    const rightCenter = Gesture.Pan().onChange(e => {
        const offset = (e.translationX * -1) + prevTranslationXValue.value;
        const newWidth = clamp( sharedValueWidth.value - offset, 100, width)
        if(newWidth + left.value < width) {
             sharedValueWidth.value = newWidth > width * 0.999 ? width: newWidth;
        }
        prevTranslationXValue.value = e.translationX;
    }).onFinalize(() => {prevTranslationXValue.value = 0})
   

    const bottomLeft = Gesture.Pan().onChange(e => {
        const horizontalOffset = e.translationX - prevTranslationXValue.value;
        const newWidth = clamp(sharedValueWidth.value - horizontalOffset, 100, width);
        const newLeft =  clamp(left.value + horizontalOffset, 0, width - newWidth);
       
        const offset = (e.translationY * -1) + prevTranslationYValue.value;
        const newHeight = clamp( sharedValueHeight.value - offset, 30, height)
       
        if(newHeight + top.value < height) {
            sharedValueHeight.value = newHeight > height * 0.999 ? height: newHeight;
        }
        
        if(newLeft > 0) {
            sharedValueWidth.value = newWidth > width * 0.999 ? width: newWidth;
            left.value =  newWidth > width * 0.999 ? 0 : newLeft;
        }
    
        prevTranslationYValue.value = e.translationY;
        prevTranslationXValue.value = e.translationX;

    }).onFinalize(() => { 
        prevTranslationYValue.value = 0
        prevTranslationXValue.value = 0
    });
    const bottomCenter = Gesture.Pan().onChange(e => {
        const offset = (e.translationY * -1) + prevTranslationYValue.value;
        const newHeight = clamp( sharedValueHeight.value - offset, 30, height)
        if(newHeight + top.value < height) {
            sharedValueHeight.value = newHeight > height * 0.999 ? height: newHeight;
        }
        prevTranslationYValue.value = e.translationY;
    }).onFinalize(() => {prevTranslationYValue.value = 0})
    const bottomRight = Gesture.Pan().onChange(e => {
        const horizontalOffset = (e.translationX * -1) + prevTranslationXValue.value;
        const newWidth = clamp( sharedValueWidth.value - horizontalOffset, 100, width);
        const offset = (e.translationY * -1) + prevTranslationYValue.value;
        const newHeight = clamp( sharedValueHeight.value - offset, 30, height)
        if(newHeight + top.value < height) {
            sharedValueHeight.value = newHeight > height * 0.999 ? height: newHeight;
        }
        if(newWidth + left.value < width) {
            sharedValueWidth.value = newWidth > width * 0.999 ? width: newWidth;
        }

        prevTranslationYValue.value = e.translationY;
        prevTranslationXValue.value = e.translationX;
    }).onFinalize(() => {
        prevTranslationYValue.value = 0
        prevTranslationXValue.value = 0
    });

   

    const renderSquare = () => (<View style={{ borderColor, borderWidth: 1, backgroundColor: 'transparent', flex: 1 / 3, height: '100%'}}/>)
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
                        <GestureDetector gesture={topLeft}>
                            {renderSquare()}
                        </GestureDetector>
                       
                        <GestureDetector gesture={topCenter}>
                            {renderSquare()}
                        </GestureDetector>

                       <GestureDetector gesture={topRight}>
                            {renderSquare()}
                       </GestureDetector>
                    </View>

                    <View style={{flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent'}}>
                       <GestureDetector gesture={leftCenter}>
                            {renderSquare()}
                       </GestureDetector>
                      
                        <GestureDetector gesture={moveGrid}>
                            {renderSquare()}
                        </GestureDetector>
                        <GestureDetector gesture={rightCenter}>  
                            {renderSquare()}
                        </GestureDetector>
                    </View>

                    <View style={{
                        flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent'
                    }}
                    >
                       <GestureDetector gesture={bottomLeft}>
                            {renderSquare()}
                       </GestureDetector>
                        <GestureDetector gesture={bottomCenter}>
                            {renderSquare()}
                        </GestureDetector>
                        <GestureDetector gesture={bottomRight}>
                            {renderSquare()}
                        </GestureDetector>
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

                 <Touch style={{backgroundColor: 'gray'}} onPress={() => setCrop(true)}>
                    <Text >crop</Text>
                </Touch>


                <Touch>
                    <Text>Editar</Text>
                </Touch>

            </View>
        </SafeAreaView>
    )
}

export default EditImageView