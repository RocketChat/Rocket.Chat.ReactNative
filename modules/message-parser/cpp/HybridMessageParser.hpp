#pragma once

#include "HybridMessageParserSpec.hpp"

namespace margelo::nitro::rocketchat::messageparser {

class HybridMessageParser : public HybridMessageParserSpec {
public:
  HybridMessageParser() : HybridObject(TAG) {}

  std::shared_ptr<Promise<std::string>> parse(const std::string& input, const std::string& optionsJson) override;
};

} // namespace margelo::nitro::rocketchat::messageparser
