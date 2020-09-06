var express = require('express');
var app = express();
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');

const passport = require('passport');
const path = require('path');
const bodyParser = require("body-parser");
app.set('view engine','ejs');
app.set('views','./views');
const urlencodedParser = bodyParser.urlencoded({extended: true});
var multer  =   require('multer');

const sequelize = new Sequelize('shop_db', 'postgres', '123', {
  host: 'localhost',
  dialect:  'postgres' 
});

var fs = require('fs');

app.use(passport.initialize());

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

app.use(bodyParser());

app.use('/public', express.static('public'));

const Model = Sequelize.Model;
class Product extends Model {}
Product.init({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: Sequelize.TEXT
  },
  category: {
    type: Sequelize.TEXT
  },
  description: {
    type: Sequelize.TEXT
  },
  price: {
    type: Sequelize.INTEGER
  },
  image: {
    type: Sequelize.TEXT
  }
}, { sequelize, modelName: 'products' });

class User extends Model {}
User.init({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: Sequelize.TEXT
  },
  surname: {
    type: Sequelize.TEXT
  },
  login: {
    type: Sequelize.TEXT
  },
  email: {
    type: Sequelize.TEXT
  },
  password: {
    type: Sequelize.TEXT
  },
  phoneNumber: {
    type: Sequelize.INTEGER
  }
}, { sequelize, modelName: 'users' });




app.get("/login", urlencodedParser, function (req, res) {
    res.render("login.ejs");
});
var privateKey = 'key';


app.post("/login", urlencodedParser, function (req, res) {
   User.findOne({where:{email: req.body.email}})
    .then(users=>{
          if(users){
               if(users.password == req.body.password){
                  const token  =jwt.sign({
                    email: users.email,
                    userId: users.id
                  }, privateKey, {expiresIn: 60*60*1000})
                  app.set('token', token);
                  
                  
                  res.json({
                    token: token,
                  });
               }else{
                  res.status(409).json({
                message: 'this password is no valid'
              })
               }
          }else{
              
               res.status(409).json({
                message: 'there is no email like this'
              })
             
              }
      }).catch(err=>console.log(err));
});

app.get("/register", urlencodedParser, function (req, res) {

    res.render("register.ejs");
});

app.post("/register", urlencodedParser, function (req, res) {
    User.findOne({where:{login: req.body.login}})
    .then(users=>{
          if(users){
               res.status(409).json({
                message: 'this email is already registered'
              })
          }else{
              sequelize.sync().then(function (){
              User.create({
              name:req.body.name,
              surname:req.body.surname,
              login:req.body.login,
              email:req.body.email,
              password:req.body.password,
              phoneNumber:req.body.phoneNumber
              });
               res.status(201).json({
                message: 'you are successfuly registered'
              })
              });
              }
      }).catch(err=>console.log(err));
});


app.get('/productview', (req, res)=> {
  
    res.render('productview.ejs',{product})
    
});

app.post('/productview', (req, res)=> {
    Product.findOne({where:{id: req.body.idd}}).then(products=>{
  
    res.render('productview.ejs',{products});
    
}).catch(err=>console.log(err)); 
});


app.get('/', (req, res)=> {
  Product.findAll({ raw:true}).then(products=>{
    
     var token = req.app.get('token');
        try {
          var x = jwt.verify(token, 'key');
        if (x) {
                  res.render('indexforregistered.ejs',{products});
        }    
        } catch (e) {
                        res.render('index.ejs',{products});
                    } 
}).catch(err=>console.log(err)); 
});



app.post('/', (req, res)=> {
    if (req.body.selectcatt == 'all') {
      Product.findAll({raw:true}).then(products=>{
        var prod = products.filter(i=>(~i.name.indexOf(req.body.filt)))
        if (req.body.selectprice == 'cheap') {
          prod.sort((a, b) => a.price > b.price ? 1 : -1);
        }
        if (req.body.selectprice == 'expensive') {
          prod.sort((a, b) => a.price < b.price ? 1 : -1);
        }
        
        products = prod;
        var token = req.app.get('token');
        try {
          var x = jwt.verify(token, 'key');
        if (x) {
                  res.render('indexforregistered.ejs',{products});
        }    
        } catch (e) {
                        res.render('index.ejs',{products});
                    } 
        
      }).catch(err=>console.log(err)); 
    }else{
      
      Product.findAll({where:{category: req.body.selectcatt}}).then(products=>{
        var prod = products.filter(i=>(~i.name.indexOf(req.body.filt)))
         if (req.body.selectprice == 'cheap') {
          prod.sort((a, b) => a.price > b.price ? 1 : -1);
        }
        if (req.body.selectprice == 'expensive') {
          prod.sort((a, b) => a.price < b.price ? 1 : -1);
        }
        products = prod;
        var token = req.app.get('token');
        try {
          var x = jwt.verify(token, 'key');
        if (x) {
                  res.render('indexforregistered.ejs',{products});
        }    
        } catch (e) {
                        res.render('index.ejs',{products});
                    } 
    
      }).catch(err=>console.log(err)); 
    }
    
});

app.get('/product', (req, res)=> {
  res.render('product.ejs')
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/img/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname +Date.now()+ path.extname(file.originalname))
  }
})

app.post('/product', function (req, res, next) {

  var upload = multer({ storage : storage}).single('photo');
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        sequelize.sync().then(function (){
        Product.create({
        name:req.body.name,
        category:req.body.selectcat,
        description:req.body.description,
        price:req.body.price,
        image:req.file.filename
  })
});
        res.end("File is uploaded ");
    });

})

app.get('/logout', (req, res)=> { 
  app.set('token', '');
  res.redirect('/');
});



app.listen(3000); 