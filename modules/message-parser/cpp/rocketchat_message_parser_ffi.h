#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
  MessageParserStatusOk = 0,
  MessageParserStatusInvalidOptions = 1,
  MessageParserStatusFailed = 2,
} MessageParserStatus;

typedef struct {
  MessageParserStatus status;
  uint8_t* bytes;
  size_t length;
} MessageParserOutput;

MessageParserOutput rocketchat_message_parser_parse(const uint8_t* input, size_t input_length,
                                                    const uint8_t* options_json, size_t options_json_length);

void rocketchat_message_parser_free(MessageParserOutput output);

#ifdef __cplusplus
}
#endif
