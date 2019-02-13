const express 		= require('express');
const mongoose 		= require('mongoose');
const bodyParser	= require('body-parser');
const validUrl		= require('valid-url');
const shortid		= require('shortid');
const dotenv		= require('dotenv');
require('dotenv').config();

const app = express();

// port number
const port = 3000;
//setting host
const host = "https://battle-trunk.glitch.me/";
//dotenv.config(config.database);
const dbUrl = process.env.MONGOLAB_URI;

// set static folder
app.use(express.static('public'));

// to parse application
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Connect to database
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});
mongoose.Promise = global.Promise;
mongoose.connection
  .on('connected', () => {
    console.log(`Mongoose connection open on ${dbUrl}`);
  })
  .on('error', (err) => {
    console.log(`Connection error: ${err.message}`);
  });

// set up url schema
const urlSchema = new mongoose.Schema({
	_id: {
				type: String,
				'default': shortid.generate
			 },
	original: String,
	created_at: {
				type: Date ,
				default: Date.now
			}
});

let userUrl = mongoose.model("userUrl", urlSchema);

// index route

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// new url - FCC testing
app.get('/new/:url(*)', function(req,res) {
  console.log('new url');
	let url = req.params.url;

  checkUrl(url, res);

});

// new url via form
app.post('/newurl', (req, res) => {
  let url = req.body.url;

  checkUrl(url, res);
});

// redirect user to original URL that was given
app.get('/:shortened_id', function(req, res) {
  console.log('checking shortened id');
	let shortened_id = req.params.shortened_id;

	// ADD FIND SHORTURL FROM DATABASE
	userUrl.findOne({ _id: shortened_id }, function(err, data) {
	// REDIRECT TO ORIGINAL URL RELATED TO SHORTURL
		if(data) {
			res.redirect(data.original);
		} else {
			res.redirect(`${host}`);
		}
	});
});

// catch all
app.get("*", function(req, res) {
	res.redirect(`${host}`);
});


//check if url is valid
const checkUrl = (url, res) => {

  let shortUrl = "";

  // check if url is valid
  if (validUrl.isUri(url)) {
    // check for duplicates
    userUrl.findOne({ original: url }, function(err, data) {
      if(data) {
          let alreadyShort = `${host}${data._id}`;
          res.send({"original_url":url, "short_url": alreadyShort});
      } else {
        // create new entry
        let newUrl = new userUrl({  original: url });

        // save the new link
        newUrl.save(function(err) {
          if (err) {
            console.log(err);
          }
        });

        shortUrl = `${host}${newUrl._id}`;

        res.send({"original_url":url, "short_url": shortUrl});
      }
    });

  } else {
    res.send({"error": "Enter a valid url. URL must be formated as follows: http(s)://(www.)domain.ext(/)(/path)"});
  }
}


const server = app.listen(port, () => {
  console.log(`App is running on port ${server.address().port}`);
});
