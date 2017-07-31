'use strict';

/*
 * nodejs-express-mongoose-demo
 * Copyright(c) 2013 Madhusudhan Srinivasa <madhums8@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */

require('dotenv').config();

const fs = require('fs');
const join = require('path').join;
const express = require('express');
const mongoose = require('mongoose');//mongoose的使用流程大概是：1、使用schema定义一张表包含哪些字段。2、使用model创建表，3、使用new 方法创建表中的一条数据。
//使用前先安装mongodb，mongodb的安装可以参考官网，或者是菜鸟教程。mongodb不是用npm安装的。例子1：http://www.cnblogs.com/jayruan/p/5123754.html
//例子：http://www.cnblogs.com/chuaWeb/p/5174951.html.官网：http://mongoosejs.com/docs/index.html
const passport = require('passport');
const config = require('./config');

const models = join(__dirname, 'app/models');
const port = process.env.PORT || 3000;
const app = express();

/**
 * Expose
 */

module.exports = app;

// Bootstrap models
fs.readdirSync(models)
  .filter(file => ~file.search(/^[^\.].*\.js$/))
  .forEach(file => require(join(models, file)));

// Bootstrap routes
require('./config/passport')(passport);
require('./config/express')(app, passport);
require('./config/routes')(app, passport);

connect()
  .on('error', console.log)
  .on('disconnected', connect)
  .once('open', listen);

function listen () {
  if (app.get('env') === 'test') return;
  app.listen(port);
  console.log('Express app started on port ' + port);
}

function connect () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  return mongoose.connect(config.db, options).connection;//用mongoose连接数据库，如果没有要连接的数据库，就新建一个。关于connect的第一个参数，看菜鸟教程上的解释。
}
