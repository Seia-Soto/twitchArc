const fetch = require('node-fetch')

const { createUrlencodeQuery } = require('../utils')
const log = require('./log')

const getAccessToken = async (opts = {}) => {
  opts.apiURL = opts.apiURL || 'https://api.twitch.tv'
  opts.username = opts.username || ''
  opts.clientID = opts.clientID || ''
  opts.clientOpts = opts.clientOpts || {
    oauth_token: '',
    need_https: true,
    platform: '_',
    player_type: 'site',
    player_backend: 'mediaplayer'
  }

  if (typeof opts.apiURL !== 'string' || !opts.apiURL.length) {
    throw new Error('The type of `domain` should be string and should be at least 1 character.')
  }
  if (typeof opts.username !== 'string' || opts.username.length < 4) {
    throw new Error('The type of `username` should be string and should be longer than 4 character.')
  }
  if (typeof opts.clientID !== 'string' || !opts.clientID) {
    throw new Error('The type of `clientID` should be string and its length should be 1 character at least.')
  }
  if (typeof opts.clientOpts !== 'object') {
    throw new Error('The type of `clientOpts` should be object.')
  }

  log(`getting the accesstoken from channel: ${opts.username}`)

  const response = await fetch(`${opts.apiURL}/api/channels/${opts.username}/access_token?${createUrlencodeQuery(opts.clientOpts)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Client-ID': opts.clientID
    }
  })
  const data = await response.json()

  log('got the accesstoken from channel: ' + opts.username)

  if (!data.token || !data.sig) {
    log('the data may be corrupted because one of required param was not given.')
  }
  if (data.mobile_restricted) {
    log('the token was restricted to mobile only.')
  }

  return data
}

module.exports = getAccessToken
