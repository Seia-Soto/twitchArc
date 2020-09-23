const fetch = require('node-fetch')
const { Parser: M3U8Parser } = require('m3u8-parser')

const { createUrlencodeQuery } = require('../utils')
const log = require('./log')

const getChannelM3U8 = async (opts = {}) => {
  opts.apiURL = opts.apiURL || 'https://usher.ttvnw.net'
  opts.username = opts.username || ''
  opts.token = opts.token || ''
  opts.sig = opts.sig || ''
  opts.videoQuality = opts.videoQuality || []
  opts.clientOpts = opts.clientOpts || {
    allow_source: true,
    fast_bread: false,
    player_backend: 'mediaplayer',
    playlist_include_framerate: true,
    reassignments_supported: true,
    sig: opts.sig,
    token: opts.token,
    supported_codecs: 'avc1',
    cdm: 'wv'
  }

  if (typeof opts.apiURL !== 'string' || !opts.apiURL.length) {
    throw new Error('The type of `domain` should be string and should be at least 1 character.')
  }
  if (typeof opts.username !== 'string' || opts.username.length < 4) {
    throw new Error('The type of `username` should be string and should be longer than 4 character.')
  }
  if (typeof opts.token !== 'string') {
    throw new Error('The type of `token` should be string.')
  }
  if (typeof opts.sig !== 'string') {
    throw new Error('The type of `sig` should be string.')
  }
  if (typeof opts.clientOpts !== 'object') {
    throw new Error('The type of `clientOpts` should be object.')
  }

  log(`getting the m3u8 playlist from channel: ${opts.username}`)

  const response = await fetch(`${opts.apiURL}/api/channel/hls/${opts.username}.m3u8?${createUrlencodeQuery(opts.clientOpts)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/x-mpegURL, application/vnd.apple.mpegurl, application/json, text/plain',
      'Content-Type': 'application/json'
    }
  })
  const data = await response.text()

  log('got the m3u8 playlist from channel: ' + opts.username)

  if (opts.raw) {
    return data
  }

  const parser = new M3U8Parser()

  parser.push(data)
  parser.end()

  const manifest = parser.manifest
  const results = {
    playlists: {},
    raw: manifest
  }

  if (opts.videoQuality && opts.videoQuality.length) {
    if (typeof opts.videoQuality === 'string') {
      opts.videoQuality = [opts.videoQuality]
    }
  } else {
    opts.videoQuality = [
      'chunked',
      '720p60',
      '720p30',
      '480p30',
      '360p30',
      '160p30'
    ]
  }

  if (!manifest.playlists) {
    throw new Error('The playlist was not found from API, please check if the user is streaming.')
  }

  for (let i = 0, l = opts.videoQuality.length; i < l; i++) {
    const playlist = manifest.playlists[i]

    if (opts.videoQuality.indexOf(playlist.attributes.VIDEO) === -1) {
      return
    }

    const playlistResponse = await fetch(playlist.uri)
    const playlistData = await playlistResponse.text()
    const playlistParser = new M3U8Parser()

    playlistParser.push(playlistData)
    playlistParser.end()

    results.playlists[playlist.attributes.VIDEO] = playlistParser.manifest
  }

  return results
}

module.exports = getChannelM3U8
