cmake_minimum_required(VERSION 3.9.0)
project(RocketChatMessageParser)

set(PACKAGE_NAME RocketChatMessageParser)
set(CMAKE_CXX_STANDARD 20)

add_library(${PACKAGE_NAME} SHARED ../cpp/HybridMessageParser.cpp ../cpp/MessageParserFfi.cpp src/main/cpp/cpp-adapter.cpp)

include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/RocketChatMessageParser+autolinking.cmake)

include_directories("../cpp")

set(RUST_TARGET_arm64-v8a aarch64-linux-android)
set(RUST_TARGET_armeabi-v7a armv7-linux-androideabi)
set(RUST_TARGET_x86 i686-linux-android)
set(RUST_TARGET_x86_64 x86_64-linux-android)
set(RUST_TARGET ${RUST_TARGET_${ANDROID_ABI}})
if(NOT RUST_TARGET)
  message(FATAL_ERROR "No Rust target for Android ABI ${ANDROID_ABI}")
endif()

find_program(CARGO cargo HINTS "$ENV{CARGO_HOME}/bin" "$ENV{HOME}/.cargo/bin" REQUIRED)
set(RUST_DIR ${CMAKE_SOURCE_DIR}/../rust)
set(RUST_LIBRARY ${RUST_DIR}/target/${RUST_TARGET}/release/librocketchat_message_parser_ffi.a)

add_custom_target(
  rust_message_parser
  COMMAND ${CARGO} build --release --locked --target ${RUST_TARGET}
  WORKING_DIRECTORY ${RUST_DIR}
  BYPRODUCTS ${RUST_LIBRARY}
  USES_TERMINAL
)
add_library(rust_message_parser_ffi STATIC IMPORTED)
set_target_properties(rust_message_parser_ffi PROPERTIES IMPORTED_LOCATION ${RUST_LIBRARY})
add_dependencies(${PACKAGE_NAME} rust_message_parser)

find_library(LOG_LIB log)

target_link_libraries(
  ${PACKAGE_NAME}
  rust_message_parser_ffi
  ${LOG_LIB}
  dl
  m
  android
)

target_link_options(${PACKAGE_NAME} PRIVATE "-Wl,--exclude-libs,ALL")
