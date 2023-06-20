FROM node:18-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

EXPOSE 5000

CMD [ "node", "dist/index.js" ]
