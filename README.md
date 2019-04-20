# Resource-parser

Parse a JSON resource file or object using `.env` file and `process.env`. 
This module allows you to refer to environment variables or keys in the object itself. 
References are searched for in all strings of the object. A string can contain one or more references.

## Install

```bash
npm i --save resource-parser
```

## Load resource

When resource loaded, it will be parser from `.env` and `process.env` data

__Default usage__

```js
const resourceParser = require('resource-parser');

/* 
    Resource can be a relative/absolute path, or an object
    If resource is a relative path or an object with "imports" key, you must provide a dirpath as second argument
*/
const config = resourceParser('./config.json');
```

__Express usage__

```js
const resourceParser = require('resource-parser');
const express = require('express');

// ...

const app = express();

/* 
    will add "config" key to "req" object
    Config data is parsed during app loading and will be cloned for each request
*/
app.use(resourceParser.middleware('./config.json'));
```

*config.json*

```json
{
    "database": {
        "name": "{DB_NAME}"
    },
    "homeDir": "{HOME}/app",
    "publicDir": "{homeDir}/public"
}
```

## Load resource with import resources

```js
const resourceParser = require('resource-parser');

const config = resourceParser('./config.json');
```

__config.json__

```json
{
    "imports": [
        "parameters.json"
    ],
    "database": {
        "name": "{DB_NAME}"
    },
    "publicDir": "{parameters.homeDir}/public"
}
```

__parameters.json__

```json
{
    "imports": [
        
    ],
    "database": {
        "host": "{DB_HOST}"
    },
    "parameters": {
        "homeDir": "{HOME}/app"
    }
}
```

## Load resource with extra data

```js
const resourceParser = require('resource-parser');

const config = resourceParser('./config.json'), {
    key: 'value'
};
```