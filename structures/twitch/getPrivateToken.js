const { chromium } = require('playwright')

const log = require('./log')

const getPrivateToken = (opts = {}) => {
  return new Promise((resolve, reject) => {
    opts.domain = opts.domain || 'twitch.tv'
    opts.timeout = opts.timeout || 15 * 1000

    if (typeof opts.domain !== 'string') {
      reject(new Error('The type of `domain` option should be `string`.'))
    }
    if (typeof opts.timeout !== 'number') {
      reject(new Error('The type of `timeout` option should be `number`.'))
    }

    // NOTE: Referer of browser object here to use after the promise.
    let browser
    // NOTE: To check if resolved two time and prevents random timeout.
    let isResolved

    log('getting latest private token from twitch api')

    chromium.launch()
      .then(browserInstance => {
        browser = browserInstance

        return browserInstance.newContext()
      })
      .then(context => context.newPage())
      .then(page => {
        // NOTE: Should use timer instead of `load` or `documentloaded` event of `playwright` because Twitch web app is React.JS app.
        const timer = setTimeout(() => {
          if (isResolved) {
            return
          }

          log('canceling the web browser because timeout reached')

          browser
            .close()
            .then(() => resolve({
              error: 'Timeout reached.'
            }))
        }, opts.timeout)

        page
          .on('request', request => {
            // NOTE: `\w{4,25}` is the format of Twitch username.
            const url = request.url()

            if (url.includes('gql')) {
              const headers = request.headers()
              const headerNames = Object.keys(headers)

              for (let i = 0, l = headerNames.length; i < l; i++) {
                const headerName = (headerNames[i] || '').toLowerCase()

                // NOTE: If the request includes the header whose name is `client-id`, catch it.
                if (headerName && headerName === 'client-id') {
                  const clientID = headers[headerName]

                  log('got private token from twitch api request: ' + clientID)

                  isResolved = 1

                  clearInterval(timer)

                  page
                    .close()
                    .then(() => browser.close())
                    .then(() => resolve({ clientID }))
                }
              }
            }
          })

        page.goto('http://' + opts.domain, {
          waitUntil: 'domcontentloaded'
        })
          .catch(error => log('possible error occured:', error))
      })
  })
}

module.exports = getPrivateToken
