'use strict';

/**
 * Module dependencies.
 */
//express官网推荐了一些有用的中间件：http://expressjs.com/en/resources/middleware.html
const express = require('express');
const session = require('express-session');//创建一个会话的中间件。cookie是保存在客户端的，而session是保存在服务器端的。http://www.cnblogs.com/chenchenluo/p/4197181.html
//为什么sessionID比cookie保存用户名和密码安全一点？sessionID不也是用cookie保存的吗？1、sessionid是动态生成的，保存sessionid的cookie有有效期，当有效期过期后攻击者获得的sessionid也就不能用了，也就是说攻击者获得sessionid后能干坏事也是有时间限制的。而如果攻击者获取了用户名和密码则就可以不受限制。2、攻击者即使获得了sessionid权限也是有限制的。比如说，他不能更改用户现有的用户名和密码，因为一般要更改用户信息，会要求再次输入用户名和密码才能修改，而此时攻击者只有sessionid。但是，如果攻击者有了用户名和密码，那么他就有了所有权限。，
const compression = require('compression');
const morgan = require('morgan');//https://stackoverflow.com/questions/27906551/node-js-logging-use-morgan-and-winston
//https://segmentfault.com/a/1190000007769095.Morgan，http请求日志中间件。
const cookieParser = require('cookie-parser');//服务端的压缩工具，压缩过后会减小传输的文件的大小，提升用户体验。支持两种格式的压缩gzip和deflate。但是如果服务端发送过来的是压缩文件，而客户端浏览器不支持怎么办？其实支持gzip的浏览器会通过HTTP头告诉服务器，如Accept-Encoding: gzip。服务器看到这个才返回gzip的内容。这是HTTP协议的规定。具体可以看RFC-2616。https://www.zhihu.com/question/25871199/answer/31797223
const cookieSession = require('cookie-session');//https://stackoverflow.com/questions/23566555/whats-difference-with-express-session-and-cookie-session
//express-session和cookie-session的区别在这篇文章中说了（https://stackoverflow.com/questions/23566555/whats-difference-with-express-session-and-cookie-session）session是 保存在多个地方的，内存、数据库、文件、或者是cookie中，express-session就可以有多种选择，而cookie-session则只能把session保存在cookie中。把session保存在cookie中有安全问题，就是用户可以更改session的内容来伪造成其他用户。怎么办呢，这时就要使用签名（hash）：服务端先设置一个密码（secret），客户登录后，服务端用这个密码和用户的信息生成一个hash值，然后将hash值和session一起发送到客户端，如果客户端伪造了session，那么他发送过来的session就和hash不能匹配，服务端就会察觉（https://zhuanlan.zhihu.com/p/25495290，https://cnodejs.org/topic/53971784a087f45620ea988a），，，，，，，，，，，，，，，，，，，，，，，
//这篇文章中说（https://stackoverflow.com/questions/23566555/whats-difference-with-express-session-and-cookie-session）为什么cookie-session得到的总是空对象，而express-session可以得到一些内容？其实cookie-session得到的总是空对象是因为还没有给session设置值啊，要使用req.session设置session的内容，然后再访问req.session就不会是空的了，express-session可以得到一些内容其实只是一些配置内容，并没有得到session内容，原因也一样，之前并没有给session设置过值，当然console的时候就得不到。
//那么问题来了，这里同时使用了express-session和cookie-session，那么调用req.session的时候到底代表的是哪个呢？实验一下
const bodyParser = require('body-parser');
const methodOverride = require('method-override');//该模块的作用是复写http的方法。为什么要用这个模块？有的时候客户端不提供某些方法，比如DELETE,PUT等（看这个例子：http://blog.csdn.net/boyzhoulin/article/details/40146197）这个模块函数支持两个参数，参数1是将要用来替换原方法的新方法，可是是字符串或者函数，如果是函数，则该函数返回新的方法。参数2是即将被替换掉的旧方法
const csrf = require('csurf');//该模块用于防范csrf攻击（关于csrf攻击，参考：http://blog.csdn.net/stpeace/article/details/53512283）。它会在客户端代码中添加一个隐藏的元素来保存token，然后服务端可以对比该token来确定请求时用户发起的还是恶意网站发起的。可以先按照npm官网上的简单例子使用一下，或者按照：http://www.cnblogs.com/y-yxh/p/5761941.html给的方法实验一下，还有更多的配置，在以后的实践中再一一实验。
const cors = require('cors');//配置CORS，跨站点资源共享，具体使用看npm官网
const upload = require('multer')();//用于处理multipart/form-data这种格式的文件上传请求。

const mongoStore = require('connect-mongo')(session);//创建一个store供express-session使用（如果不加mongodb则session是存储在内存中的，加上过后，就是存储在mongodb中了）：http://www.cnblogs.com/chenchenluo/p/4197181.html。如果要修改session，就用req.session进行修改。express的req对象是没有session这个属性的（看手册http://www.expressjs.com.cn/4x/api.html#req）所以这里的session属性是中间件对req进行了改写。
const flash = require('connect-flash');//Flash是一个在session中存储信息的中间件。通常和重定向结合使用。当使用了这个中间件后，req就会有一个Flash方法，即req.flash（），可以用这个方法，在一个页面中存储消息，然后在另一个页面中取出该消息。https://www.npmjs.com/package/connect-flash
const winston = require('winston');//多传输日志记录模块，为什么有了Morgan，还要使用Winston？
const helpers = require('view-helpers');//在view文件（view文件就是一些模板文件，在app.set方法设置的engine文件夹中）中可以使用一些方法（这些方法在https://www.npmjs.com/package/view-helpers查看）（个人猜测的，实际使用中验证一下）
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
