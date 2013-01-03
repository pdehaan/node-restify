module.exports = [
    {
        name         : 'errors'
      , input        : [
            require.resolve('../lib/errors/index')
          , require.resolve('../lib/errors/http_error')
          , require.resolve('../lib/errors/rest_error')
        ]
    }
  , {
        name         : 'response'
      , input        : [
            require.resolve('../lib/response')
          , require.resolve('../lib/http_date')
        ]
      , rewrite      : {
            'errors/index.js': {
                from: 'errors'
              , to: 'errors'
            }
        }
    }
  , {
        name         : 'request'
      , input        : [
            require.resolve('../lib/request')
          , require.resolve('../lib/utils')
        ]
    }
  , {
        name         : 'plugin-gzip'
      , input        : [
            require.resolve('../lib/plugins/gzip')
        ]
    }
  , {
        name         : 'plugin-query'
      , input        : [
            require.resolve('../lib/plugins/query')
        ]
      , replacements : [
            {   // query.js relies on the existence of req.params
                file    : require.resolve('../lib/plugins/query')
              , regexp  : /(function parseQueryString.*)$/m
              , replace : '$1\n\t\tif (!req.params) req.params = {};\n'
            }
        ]
    }
]