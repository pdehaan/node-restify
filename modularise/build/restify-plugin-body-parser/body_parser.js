// Copyright 2012 Mark Cavage, Inc.  All rights reserved.

var assert = require('assert-plus');

var errors = require('./errors');

var bodyReader = require('./body_reader');
var jsonParser = require('./json_body_parser');
var formParser = require('./form_body_parser');
var multipartParser = require('./multipart_parser');



///--- Globals

var UnsupportedMediaTypeError = errors.UnsupportedMediaTypeError;



///--- API

function bodyParser(options) {
        assert.optionalObject(options, 'options');
        options = options || {};
        options.bodyReader = true;

        var read = bodyReader(options);
        var parseForm = formParser(options);
        var parseJson = jsonParser(options);
        var parseMultipart = multipartParser(options);

        function parseBody(req, res, next) {
                if (req.method === 'GET' || req.method === 'HEAD') {
                        next();
                        return;
                }
                if (req.contentLength() === 0 && !req.isChunked()) {
                        next();
                        return;
                }

                var parser;
                var type = req.contentType();
                switch (type) {
                case 'application/json':
                        parser = parseJson[0];
                        break;
                case 'application/x-www-form-urlencoded':
                        parser = parseForm[0];
                        break;
                case 'multipart/form-data':
                        parser = parseMultipart;
                        break;
                default:
                        break;
                }

                if (parser) {
                        parser(req, res, next);
                } else if (options && options.rejectUnknown) {
                        next(new UnsupportedMediaTypeError(type));
                } else {
                        next();
                }
        }

        return ([read, parseBody]);
}

module.exports = bodyParser;