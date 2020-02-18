import React, { Component } from "react";

enum ThreadType {
  image,
  URL,
  Video,
  Training,
  Program
}

interface ThreadPreview {
  Title: string;
  Balls: number;
  ThreadType: ThreadType;
  render: Function;
  File?: File;
  previewText?: string;
  previewURL?: URL;
}

interface ImageThread extends ThreadPreview {
  super();
  image: File;
}

const threadPreview: ThreadPreview = {
  Title: "threadpreview test",
  Balls: 2,
  ThreadType: ThreadType.Program,
  render: getNumber,
  previewText: "dit is een dit is een thread preview"
};

/**
 * function createImageThread (File file) : ImageThread{
    return  {
        Title : "createimagethread test",
        Balls : 2,
        ThreadType : ThreadType.Program,
        render : getNumber,
        previewText : "dit is een dit is een threadimage preview",
        image : Image,
    };
}
**/

var obj = {
  func: getNumber
};

obj.func();

function getNumber() {
  return 6;
}
