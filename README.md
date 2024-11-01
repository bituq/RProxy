# RProxy

RProxy is a Bun application designed to act as a proxy for Roblox API requests. It is deployed on Heroku and provides a secure and efficient way to interact with Roblox's API.

## Features

- **Proxy for Roblox API**: Forward requests to Roblox's API with ease.
- **Security Key**: Validate incoming requests using a security key.
- **Configurable Timeout and Retries**: Set timeout duration and retry attempts for requests.
- **Heroku Deployment**: Easily deployable on Heroku with a single click.

## Environment Variables

The application uses the following environment variables:

- `PORT`: The port Heroku will use to run the server. Default is `3000`.
- `TIMEOUT`: Timeout duration in seconds for each request made by the proxy. Default is `30`.
- `RETRIES`: Number of retry attempts if a request fails. Default is `3`.
- `KEY`: A required security key for validating incoming requests. Requests must include a matching `PROXYKEY` header.

## Deployment

To deploy this application on Heroku, click the button below:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/bituq/RProxy)

## Usage

1. **Set Environment Variables**: Ensure all required environment variables are set, especially the `KEY` for security.
2. **Run the Server**: The server will start on the specified `PORT` and listen for incoming requests.
3. **Make Requests**: Send requests to the proxy with the appropriate `PROXYKEY` header.

## Code Overview

- **app.json**: Contains the app configuration for Heroku deployment.

- **Procfile**: Specifies the command to run the server.

- **server.js**: Main server file handling incoming requests and proxy logic.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.
