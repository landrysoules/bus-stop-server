[![Build Status](https://semaphoreci.com/api/v1/projects/eee79177-df18-4b64-9bc4-e1f1939ecbe0/548061/badge.svg)](https://semaphoreci.com/landry/bus-stop-server)
# bus-stop-server
Server side application for BusStop mobile app.

## Contributing

1. Fork it ( https://github.com/[my-github-username]/bus-stop-server/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Instructions

To start the app:  
COUCH_URL=<couch url> DB_NAME=<database name> NODE_ENV=test npm start|bunyan

To run the tests:
COUCH_URL=<couch url> DB_NAME=<database name> NODE_ENV=test npm test|bunyan

COUCH_URL is expected to be in the form: http://username:userpassword@server:port  
DB_NAME is self-explaining

By piping to bunyan, you will obtain nice formatted logs.  
