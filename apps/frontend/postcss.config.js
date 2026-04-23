const path = require('path');
const rootModules = path.resolve(__dirname, '../../node_modules');

module.exports = {
  plugins: {
    [path.join(rootModules, 'tailwindcss')]: {},
    [path.join(rootModules, 'autoprefixer')]: {},
  },
};
