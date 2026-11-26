#include "HybridMessageParser.hpp"

#include "MessageParserFfi.hpp"

namespace margelo::nitro::rocketchat::messageparser {

std::shared_ptr<Promise<std::string>> HybridMessageParser::parse(const std::string& input, const std::string& optionsJson) {
  return Promise<std::string>::async([input, optionsJson]() { return parseToJson(input, optionsJson); });
}

} // namespace margelo::nitro::rocketchat::messageparser
