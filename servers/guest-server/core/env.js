let options = {
  path: `env/${process.env.NODE_ENV}.env`
};

require('dotenv').config(options);
