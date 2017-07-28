'use strict';

/**
 * Module dependencies.
 */
//express官网推荐了一些有用的中间件：http://expressjs.com/en/resources/middleware.html
const express = require('express');
const session = require('express-session');//创建一个会话的中间件。
const compression = require('compression');
const morgan = require('morgan');//https://stackoverflow.com/questions/27906551/node-js-logging-use-morgan-and-winston
//https://segmentfault.com/a/1190000007769095.Morgan，http请求日志中间件。
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');//该模块的作用是复写http的方法。为什么要用这个模块？有的时候客户端不提供某些方法，比如DELETE,PUT等（看这个例子：http://blog.csdn.net/boyzhoulin/article/details/40146197）这个模块函数支持两个参数，参数1是将要用来替换原方法的新方法，可是是字符串或者函数，如果是函数，则该函数返回新的方法。参数2是即将被替换掉的旧方法
const csrf = require('csurf');//该模块用于防范csrf攻击（关于csrf攻击，参考：http://blog.csdn.net/stpeace/article/details/53512283）。它会在客户端代码中添加一个隐藏的元素来保存token，然后服务端可以对比该token来确定请求时用户发起的还是恶意网站发起的。可以先按照npm官网上的简单例子使用一下，或者按照：http://www.cnblogs.com/y-yxh/p/5761941.html给的方法实验一下，还有更多的配置，在以后的实践中再一一实验。
const cors = require('cors');//配置CORS，跨站点资源共享，具体使用看npm官网
const upload = require('multer')();//用于处理multipart/form-data这种格式的文件上传请求。

const mongoStore = require('connect-mongo')(session);//创建一个store供express-session使用（如果不加mongodb则session是存储在内存中的，加上过后，就是存储在mongodb中了）：http://www.cnblogs.com/chenchenluo/p/4197181.html。如果要修改session，就用req.session进行修改。express的req对象是没有session这个属性的（看手册http://www.expressjs.com.cn/4x/api.html#req）所以这里的session属性是中间件对req进行了改写。
const flash = require('connect-flash');
const winston = require('winston');//多传输日志记录模块，为什么有了Morgan，还要使用Winston？
const helpers = require('view-helpers');
const config = require('./');
const pkg = require('../package.json');

const env = process.env.NODE_ENV || 'development';

/**
 * Expose
 */

module.exports = function (app, passport) {

  // Compression middleware (should be placed before express.static)
  app.use(compression({
    threshold: 512
  }));

  app.use(cors({
    origin: ['http://localhost:3000', 'https://reboil-demo.herokuapp.com'],
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    credentials: true
  }));

  // Static files middleware
  app.use(express.static(config.root + '/public'));

  // Use winston on production
  let log = 'dev';
  if (env !== 'development') {
    log = {
      stream: {
        write: message => winston.info(message)
      }
    };
  }

  // Don't log during tests
  // Logging middleware
  if (env !== 'test') app.use(morgan(log));

  // set views path, template engine and default layout
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'jade');

  // expose package.json to views
  app.use(function (req, res, next) {
    res.locals.pkg = pkg;
    res.locals.env = env;
    next();
  });

  // bodyParser should be above methodOverride
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(upload.single('image'));
  app.use(methodOverride(function (req) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  // CookieParser should be above session
  app.use(cookieParser());
  app.use(cookieSession({ secret: 'secret' }));
  app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: pkg.name,
    store: new mongoStore({
      url: config.db,
      collection : 'sessions'
    })
  }));

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // connect flash for flash messages - should be declared after sessions
  app.use(flash());

  // should be declared after session and flash
  app.use(helpers(pkg.name));

  if (env !== 'test') {
    app.use(csrf());

    // This could be moved to view-helpers :-)
    app.use(function (req, res, next) {
      res.locals.csrf_token = req.csrfToken();
      next();
    });
  }

  if (env === 'development') {
    app.locals.pretty = true;
  }
};
