#include "MessageParserFfi.hpp"

#include <stdexcept>

#include "rocketchat_message_parser_ffi.h"

namespace margelo::nitro::rocketchat::messageparser {

namespace {

class OwnedOutput {
public:
  explicit OwnedOutput(MessageParserOutput output) : output_(output) {}
  ~OwnedOutput() { rocketchat_message_parser_free(output_); }
  OwnedOutput(const OwnedOutput&) = delete;
  OwnedOutput& operator=(const OwnedOutput&) = delete;

  MessageParserStatus status() const { return output_.status; }
  std::string text() const { return std::string(reinterpret_cast<const char*>(output_.bytes), output_.length); }

private:
  MessageParserOutput output_;
};

const uint8_t* bytesOf(const std::string& text) {
  return reinterpret_cast<const uint8_t*>(text.data());
}

} // namespace

std::string parseToJson(const std::string& input, const std::string& optionsJson) {
  OwnedOutput output(rocketchat_message_parser_parse(bytesOf(input), input.size(), bytesOf(optionsJson), optionsJson.size()));
  switch (output.status()) {
    case MessageParserStatusOk:
      return output.text();
    case MessageParserStatusInvalidOptions:
      throw std::invalid_argument("Invalid message parser options: " + output.text());
    default:
      throw std::runtime_error("Message parser failed: " + output.text());
  }
}

} // namespace margelo::nitro::rocketchat::messageparser
