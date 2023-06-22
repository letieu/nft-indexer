FROM node:16.14.0-alpine3.14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install

# Bundle app source
COPY . .

RUN pnpm run build

EXPOSE 3000

CMD [ "pnpm", "start" ]
