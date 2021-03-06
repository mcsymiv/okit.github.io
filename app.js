require('dotenv').config()
const createError = require('http-errors');

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const favicon = require('serve-favicon');
const methodOverride = require('method-override');
const sassMiddleware = require('node-sass-middleware');
const engine = require('ejs-mate');

const User = require('./models/user');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const recipesRouter = require('./routes/recipes');
const commentsRouter = require('./routes/comments');

const app = express();

//mongooseDB connect
mongoose
  .connect('mongodb://localhost:27017/okit', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log('database connected');
  })
  .catch(err => {
    console.log('Could not connect', err);
  });

/* alternative error handler 
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open',()=>{
  console.log('database is connected')
})
*/

// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//basic boilrerplate config
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//setup public assets directory 
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'))
app.use(sassMiddleware({
  src: path.join(__dirname, '/scss'),
  dest: path.join(__dirname, '/public/stylesheets'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true,
  outputStyle: 'compressed',
  debug: true,
  force: true
}));


//session config
app.use(session({
  secret: 'okit application',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

//passport config
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// set local variables, pre-route middleware
app.use(function(req,res,next){

  // create user auto authentication
  req.user = {
    '_id' : '5eff0d5a0e99143d208fc69e',
    'username' : 'mcs'
  }
  res.locals.currentUser = req.user

  // set success flash message
  res.locals.success = req.session.success || '';
  delete req.session.success;

  // set error flash message
  res.locals.error = req.session.error || '';
  delete req.session.error;

  // continue on with next function in middleware chain
  next()
})

//mount routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/recipes', recipesRouter);
app.use('/recipes/:recipe_id/comments', commentsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next();
});

// error handler
app.use((err, req, res, next) => {

  //default express error handler
  /*
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  */

  console.log(`App error: ${err}`)
  console.log(`App error status: ${err.status}`)
  console.log(`App error stack: ${err.stack}`)
  req.session.error = err.message
  res.redirect('back')

});

module.exports = app;
