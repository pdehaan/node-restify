const async     = require('async')
    , fs        = require('fs')
    , path      = require('path')
    , mkdirp    = require('mkdirp')
    , detective = require('detective')
    , resolve   = require('resolve')
    , extend    = require('util')._extend
    , ncp       = require('ncp').ncp
    , rimraf    = require('rimraf')

const OUTPUT_DIR  = path.join(__dirname, 'build')
    , DESCRIPTION = 'restify component ({name})'

    , packages = require('./packages.js')

    , packageDescriptor = (function () {
        var p = require('../package')
        ;delete p.main
        ;delete p.bin
        ;delete p.directories
        ;delete p.name
        ;delete p.scripts
        ;delete p.devDependencies
        p.repository.url = 'git@github.com:rvagg/node-restify.git'
        return p
      }())

    , absoluteModule = function (file, mod) {
        var absPath = resolve.sync(mod, { basedir: path.dirname(file) })
        return !resolve.isCore(mod) && path.relative(file, absPath).indexOf('node_modules') > -1
      }

    , relativeModule = function (file, mod) {
        var absPath = resolve.sync(mod, { basedir: path.dirname(file) })
        return !resolve.isCore(mod) && absPath && path.relative(file, absPath).indexOf('node_modules') == -1 && absPath
      }

    , processReplacements = function (pkg, f, content) {
        console.log('processRewrites', f)
        if (pkg.replacements) {
          pkg.replacements.forEach(function (replacement) {
            console.log(replacement, f)
            if (replacement.file == f) {
              content = content.replace(replacement.regexp, replacement.replace)
            }
          })
        }
        return content
      }

    , processInput = function (pkg, basedir, f, callback) {
        // write the output file
        fs.readFile(f, 'utf8', function (err, data) {
          if (err) return callback(err)
          data = processReplacements(pkg, f, data.toString())
          fs.writeFile(path.join(basedir, path.basename(f)), data, 'utf8', function (err) {
            if (err) return callback(err)
            // find any external deps
            var packages = detective(data)
            callback(null, {
                globals : packages.filter(absoluteModule.bind(null, f))
              , locals  : packages.map(relativeModule.bind(null, f)).filter(function (f) { return f })
            })
          })
        })
      }

    , processRewrites = function (pkg, basedir, callback) {
        if (!pkg.rewrite) return callback()
        async.forEach(
            Object.keys(pkg.rewrite)
          , function (r, callback) {
              var to = pkg.rewrite[r].to
                , mod = 'module.exports = require("restify-' + to + '")'
              fs.writeFile(path.join(basedir, pkg.rewrite[r].from + '.js'), mod, 'utf8', callback)
            }
        )
      }

    , processOutput = function (pkg, descriptor, basedir, packages, callback) {
        // flatten, unique not important
        var globals = packages.reduce(function (arr, packages) { return arr.concat(packages.globals) }, [])
          , locals = packages.reduce(function (arr, packages) { return arr.concat(packages.locals) }, [])

        locals.forEach(function (mod) {
          if (pkg.input.indexOf(mod) == -1
              && (!pkg.rewrite
                      // ugh!
                  || !pkg.rewrite[mod.replace(path.resolve(path.join(__dirname, '../lib/')) + '/', '')]))
            console.error('WARNING: package', pkg.name, 'does not include required local file')
        })

        // filter dependencies to only those required
        Object.keys(descriptor.dependencies).forEach(function (dep) {
          if (globals.indexOf(dep) == -1) {
            delete descriptor.dependencies[dep]
          }
        })

        if (pkg.rewrite) {
          Object.keys(pkg.rewrite).forEach(function (r) {
            descriptor.dependencies['restify-' + pkg.rewrite[r].from] = descriptor.version
          })
        }

        async.parallel(
            [
                fs.writeFile.bind(fs, path.join(basedir, 'package.json'), JSON.stringify(descriptor, null, 2), 'utf8')
              , processRewrites.bind(null, pkg, basedir)
              , ncp.bind(ncp, path.join(__dirname, 'README.md'), path.join(basedir, 'README.md'))
            ]
          , callback
        )
      }

rimraf.sync(OUTPUT_DIR)

async.forEach(packages, function (pkg, callback) {
  var descriptor = extend({}, packageDescriptor)
    , name       = 'restify-' + pkg.name
    , basedir    = path.join(OUTPUT_DIR, name)

  descriptor.dependencies = {}
  extend(descriptor.dependencies, packageDescriptor.dependencies)
  descriptor.name = name
  descriptor.main = './' + path.basename(pkg.input[0])
  descriptor.description = DESCRIPTION.replace('{0}', pkg.name)
  mkdirp(basedir, function () {
    async.map(
        pkg.input
      , processInput.bind(null, pkg, basedir)
      , function (err, packages) {
          if (err) return callback(err)
          processOutput(pkg, descriptor, basedir, packages, callback)
        }
    )
  })
})