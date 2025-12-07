// Конфигурация для отключения предупреждений source-map-loader
module.exports = function override(config, env) {
  // Найти правило source-map-loader и исключить node_modules
  config.module.rules.forEach((rule) => {
    if (rule.enforce === 'pre' && rule.use && Array.isArray(rule.use)) {
      rule.use.forEach((use) => {
        if (use.loader && use.loader.includes('source-map-loader')) {
          // Исключить node_modules из обработки source-map-loader
          if (!rule.exclude) {
            rule.exclude = /node_modules/;
          } else if (Array.isArray(rule.exclude)) {
            rule.exclude.push(/node_modules/);
          } else {
            rule.exclude = [rule.exclude, /node_modules/];
          }
        }
      });
    }
  });

  return config;
};

