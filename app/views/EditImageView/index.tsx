import React, {  useState } from "react";
import { Button, Image, View, Text, useWindowDimensions} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImagePickerOptions } from "expo-image-picker";
import {  SaveFormat, useImageManipulator } from 'expo-image-manipulator';
import { Gesture } from "react-native-gesture-handler";
import Animated, { clamp, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import ImagePicker from "../../lib/methods/helpers/ImagePicker/ImagePicker";
import { getPermissions } from '../../lib/methods/helpers/ImagePicker/getPermissions';
import { mapMediaResult } from '../../lib/methods/helpers/ImagePicker/mapMediaResult';
import Touch from "../../containers/Touch";
import Cell from "./components/Cell";
import Grid from "./components/Grid";


// To Do:
// - reescale the image decreasing for the screen value range;
// - Portrait and Landscape;
// - Add Pinch detector;
// - Organize code;
// - Adjust the layout;

// Components:
// - Grid;

// Hooks:
// - useImageManipulator;



const EditImageView = () => {
    const [crop, setCrop] = useState(false);
    const [imageSize, setImageSize] = useState<any>({width: 0, height: 0});
    const [originalImageSize, setOriginalImageSize] = useState<any>({width: 0, height: 0});
    const [editableImage, setEditableImage] = useState('');
    const [rotate, setRotate] = useState(0);    
    const context = useImageManipulator(editableImage);
    const isPortrait = originalImageSize?.height > originalImageSize?.width;

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
            setOriginalImageSize(media);
		} catch (error: any) {
            console.log(error)
		}
	};

    const rotateLeft =  () => {
        const newRotate = rotate + 90;
        
        if(newRotate === 90 || newRotate === 270){
            const widthUpdated = !isPortrait ? height : width;
            const heightUpdated = !isPortrait ? width : height;
            sharedValueHeight.value = heightUpdated;
            sharedValueWidth.value = widthUpdated
            setOriginalImageSize({
                width: widthUpdated,
                height: heightUpdated
            })
        }else{
            const widthUpdated = isPortrait ? height : width;
            const heightUpdated = isPortrait ? width : height;
            sharedValueHeight.value = heightUpdated;
            sharedValueWidth.value = widthUpdated;
            setOriginalImageSize({
                width: isPortrait ? originalImageSize.height : originalImageSize.width, 
                height: isPortrait ? originalImageSize.width : originalImageSize.height 
            })
        }        
        setRotate(newRotate > 270 ? 0 : newRotate);

    };

    const rotateRight =  () => {
        setRotate(rotate - 90)
    };

    const getValueBasedOnOriginal = (cuttedValue: number, originalSize: number, screenScale: number) => {
        const escala = originalSize / screenScale;
        return cuttedValue * escala;
    }

    const onCrop = async () => {
        context.rotate(rotate);
        const finalWidth = getValueBasedOnOriginal(sharedValueWidth.value, originalImageSize.width, width);
        const finalHeight = getValueBasedOnOriginal(sharedValueHeight.value, originalImageSize.height, height);
        const originX = getValueBasedOnOriginal(left.value, originalImageSize.width, width);
        const originY = getValueBasedOnOriginal(top.value, originalImageSize.height, height);
        context.crop({
            height: finalHeight,
            width: finalWidth ,
            originX,
            originY
        }) 
        const image = await context.renderAsync();
            const result = await image.saveAsync({
            format: SaveFormat.PNG
            });

        setEditableImage(result.uri);
        setCrop(false)
       
    }

    const borderColor = 'white'
    const {width, height: screenHeight} = useWindowDimensions();
    const height = isPortrait ? screenHeight * .46 : 300;
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
        borderWidth: 4, 
        borderColor: 'white',
        alignItems: 'center',
        justifyContent: 'center'
    }))

    const topLeft = Gesture.Pan().onChange(e => {
        // discover the value that moved;
        const verticalOffset = e.translationY - prevTranslationYValue.value;
        // discover the new height based on translation;
        const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationYValue.value), 30, height);
        // add the value on topValue and add a clamp to limit it;
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
      
        const newLeft = clamp(left.value + offset, 0, width - sharedValueWidth.value);
        const newTop =  clamp(top.value + verticalOffset, 0, height - sharedValueHeight.value);

        if(sharedValueWidth.value < width) {
            left.value = newLeft
        } 

        if(sharedValueHeight.value < height) {
            top.value = newTop
        }

        prevTranslationXValue.value = e.translationX
        prevTranslationYValue.value = e.translationY

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

    return(  
        <SafeAreaView>
            
            <View style={{ backgroundColor: '#000'}}> 
                <Image 
                    source={{uri: editableImage}} 
                    style={{
                        width, height,
                        transform: [{rotate: `${rotate}deg`}]
                    }}  
                    resizeMode='contain'
                />

                {
                    editableImage && crop
                    ?
                <Animated.View style={animatedStyle}>               
                    <Grid>
                        <Cell gesture={topLeft} />
                        <Cell gesture={topCenter} />
                        <Cell gesture={topRight} />
                    </Grid>
                       
                    <Grid>
                        <Cell gesture={leftCenter} />
                        <Cell gesture={moveGrid} />
                        <Cell gesture={rightCenter} />  
                    </Grid>
                        
                    <Grid>
                       <Cell gesture={bottomLeft} />
                        <Cell gesture={bottomCenter} />
                        <Cell gesture={bottomRight} />
                    </Grid>
                </Animated.View>
                    : null
                }

            
            </View>


            <Button title='Open Gallery' onPress={pickImage} />
            <Button title='crop' onPress={onCrop} />

            <View style={{flexDirection: 'column', gap: 20}}>
                <Touch>
                    <Text>Cancelar</Text>
                </Touch>
                 <Touch onPress={rotateLeft}>
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