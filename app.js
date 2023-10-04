var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var users = require('./routes/test')
var user = require('./routes/user');
var admin = require('./routes/admin');
var hbs = require('express-handlebars');
var handlebars=require('handlebars')

var app = express();
var db=require('./config/connection')
var session=require('express-session')

handlebars.registerHelper('inc',function(value,options){
  return(value)+1
})
handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});
handlebars.registerHelper('ifIn', function(elem, list, options) {
  if(list.indexOf(elem) > -1) {
    return options.fn(this);
  }
  return options.inverse(this);
});
handlebars.registerHelper("when", (operand_1, operator, operand_2, options) => {
  let operators = {                     //  {{#when <operand1> 'eq' <operand2>}}
    'eq': (l,r) => l == r,              //  {{/when}}
    'noteq': (l,r) => l != r,
    'gt': (l,r) => (+l) > (+r),                        // {{#when var1 'eq' var2}}
    'gteq': (l,r) => ((+l) > (+r)) || (l == r),        //               eq
    'lt': (l,r) => (+l) < (+r),                        // {{else when var1 'gt' var2}}   
    'lteq': (l,r) => ((+l) < (+r)) || (l == r),        //               gt
    'or': (l,r) => l || r,                             // {{else}}
    'and': (l,r) => l && r,                            //               lt
    '%': (l,r) => (l % r) === 0                        // {{/when}}
  }
  let result = operators[operator](operand_1,operand_2);
  if(result) return options.fn(this); 
  return options.inverse(this);       
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:'Key',
  cookie:{maxAge:6000000},
  resave: false, // Set to false to avoid the deprecation warning
  saveUninitialized: true, // Set to true or false as per your application's needs
  }))
db.connect((err)=>{
  if(err)
  console.log('Connection Error'+err);
  else
  console.log('Database connected to port 27017');
})
app.use((req,res,next)=>{
  res.set('cache-control','no-store')
  next()
})
app.use('/', user);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
