#pragma once

#include <string>

namespace margelo::nitro::rocketchat::messageparser {

std::string parseToJson(const std::string& input, const std::string& optionsJson);

} // namespace margelo::nitro::rocketchat::messageparser
