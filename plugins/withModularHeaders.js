// RNGoogleSignin's AppCheckCore (Swift) needs module maps from its ObjC deps.
// A raw Podfile edit dies on every `prebuild --clean` — this plugin re-applies it.
const { withPodfile } = require('expo/config-plugins');

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (c) => {
    if (!c.modResults.contents.includes('use_modular_headers!')) {
      c.modResults.contents = c.modResults.contents.replace(
        'use_expo_modules!',
        'use_expo_modules!\n  use_modular_headers!',
      );
    }
    return c;
  });
};
