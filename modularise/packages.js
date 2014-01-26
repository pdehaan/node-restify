// fix up ../errors to ./errors
var pluginErrorReplacement = function (plugin) {
      return {
          file    : require.resolve('../lib/plugins/' + plugin)
        , regexp  : /\.\.\/errors/
        , replace : './errors'
      }
    }


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
            'errors/index.js': { from: 'errors', to: 'errors' }
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
              , replace : '$1\n                if (!req.params) req.params = {};\n'
            }
        ]
    }
  , {
        name         : 'plugin-body-reader'
      , input        : [
            require.resolve('../lib/plugins/body_reader')
        ]
      , replacements : [
            pluginErrorReplacement('body_reader')
        ]
       , rewrite      : {
            'errors/index.js': { from: 'errors', to: 'errors' }
        }
    }
  , {
        name         : 'plugin-form-body-parser'
      , input        : [
            require.resolve('../lib/plugins/form_body_parser')
        ]
      , replacements : [
            pluginErrorReplacement('form_body_parser')
          , {   // relies on the existence of req.params
                file    : require.resolve('../lib/plugins/form_body_parser')
              , regexp  : /(function parseUrlEncodedBody.*)$/m
              , replace : '$1\n                if (!req.params) req.params = {};\n'
            }
          , {   // relies on the existence of req.log.trace
                file    : require.resolve('../lib/plugins/form_body_parser')
              , regexp  : /^                req\.log\.trace\(/m
              , replace : '                if (req.log && req.log.trace) req.log.trace('
            }
        ]
       , rewrite      : {
            'errors/index.js': { from: 'errors', to: 'errors' }
          , 'plugins/body_reader.js': { from: 'body_reader', to: 'plugin-body-reader' }
        }
    }
  , {
        name         : 'plugin-json-body-parser'
      , input        : [
            require.resolve('../lib/plugins/json_body_parser')
        ]
      , replacements : [
            pluginErrorReplacement('json_body_parser')
          , {   // relies on the existence of req.params
                file    : require.resolve('../lib/plugins/json_body_parser')
              , regexp  : /(function parseJson.*)$/m
              , replace : '$1\n                if (!req.params) req.params = {};\n'
            }
        ]
       , rewrite      : {
            'errors/index.js': { from: 'errors', to: 'errors' }
          , 'plugins/body_reader.js': { from: 'body_reader', to: 'plugin-body-reader' }
        }
    }
  , {
        name         : 'plugin-multipart-parser'
      , input        : [
            require.resolve('../lib/plugins/multipart_parser')
        ]
      , replacements : [
            pluginErrorReplacement('multipart_parser')
          , {   // relies on the existence of req.params
                file    : require.resolve('../lib/plugins/multipart_parser')
              , regexp  : /(function parseMultipartBody.*)$/m
              , replace : '$1\n                if (!req.params) req.params = {};\n'
            }
        ]
       , rewrite      : {
            'errors/index.js': { from: 'errors', to: 'errors' }
        }
    }
  , {
        name         : 'plugin-fielded-text-body-parser'
      , input        : [
            require.resolve('../lib/plugins/fielded_text_body_parser')
        ]
      , replacements : [
            pluginErrorReplacement('fielded_text_body_parser')
        ]
       , rewrite      : {
            'errors/index.js': { from: 'errors', to: 'errors' }
          , 'plugins/body_reader.js': { from: 'body_reader', to: 'plugin-body-reader' }
        }
    }
  , {
        name         : 'plugin-body-parser'
      , input        : [
            require.resolve('../lib/plugins/body_parser')
        ]
      , replacements : [
            pluginErrorReplacement('body_parser')
        ]
       , rewrite      : {
            'errors/index.js': { from: 'errors', to: 'errors' }
          , 'plugins/body_reader.js': { from: 'body_reader', to: 'plugin-body-reader' }
          , 'plugins/json_body_parser.js': { from: 'json_body_parser', to: 'plugin-json-body-parser' }
          , 'plugins/form_body_parser.js': { from: 'form_body_parser', to: 'plugin-form-body-parser' }
          , 'plugins/multipart_parser.js': { from: 'multipart_parser', to: 'plugin-multipart-parser' }
          , 'plugins/fielded_text_body_parser.js': { from: 'fielded_text_body_parser', to: 'plugin-fielded-text-body-parser' }
        }
    }
  , {
        name         : 'plugin-pre-pause'
      , input        : [
            require.resolve('../lib/plugins/pre/pause')
        ]
      , replacements : []
    }
  , {
        name         : 'plugin-pre-path'
      , input        : [
            require.resolve('../lib/plugins/pre/pre_path')
        ]
      , replacements : []
    }
]
