#include <jni.h>

#include "RocketChatMessageParserOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::rocketchat::messageparser::initialize(vm);
}
