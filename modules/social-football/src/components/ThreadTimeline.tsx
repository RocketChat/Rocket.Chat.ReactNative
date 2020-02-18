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
  Title: "penis",
  Balls: 2,
  ThreadType: ThreadType.Program,
  render: getNumber,
  previewText: "dit is een penis"
};

/**
 * function createImageThread (File file) : ImageThread{
    return  {
        Title : "penis",
        Balls : 2,
        ThreadType : ThreadType.Program,
        render : getNumber,
        previewText : "dit is een penis",
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
