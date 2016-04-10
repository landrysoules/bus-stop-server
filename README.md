[![Build Status](https://semaphoreci.com/api/v1/projects/eee79177-df18-4b64-9bc4-e1f1939ecbe0/548061/badge.svg)](https://semaphoreci.com/landry/bus-stop-server)
# bus-stop-server
Server side application for BusStop mobile app.  
This app is in charge of collecting data and update lines and stations database.

## Contributing

1. Fork it ( https://github.com/[my-github-username]/bus-stop-server/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Instructions

To test the app:  
LOG_LEVEL=<log level> DB_URL=mongodb://<DB url> npm test|bunyan


To run the app:  
LOG_LEVEL=<log level> DB_URL=mongodb://<DB url> npm start|bunyan

DB_URL is expected to be in the form: mongodb://host:port/database_name  
LOG_LEVEL is one of trace, debug, info, warn, error, fatal

By piping to bunyan, you will obtain nice formatted logs.  
