FROM node:16-alpine As build
ARG BRANCH

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

RUN apk add python3 make gcc g++

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY --chown=node:node package.json pnpm-lock.yaml ./

RUN pnpm install

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN pnpm build

# Set NODE_ENV environment variable
ENV NODE_ENV production

USER node

###################
# PRODUCTION
###################
FROM node:16-alpine As production

RUN npm install pm2 -g

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/ecosystem.config.js ./ecosystem.config.js
COPY --chown=node:node --from=build /usr/src/app/api.yaml ./api.yaml

CMD ["pm2-runtime", "ecosystem.config.js"]
EXPOSE 3077
