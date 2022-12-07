var config

if (process.env.NODE_ENV === 'production') {
  config = require('./prod')
} else {
  console.log('here');
  config = require('./dev')
}
config.isGuestMode = true

module.exports = config
