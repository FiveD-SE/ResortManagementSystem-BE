FROM node:lts-alpine as development

RUN apk add --no-cache \
  bash \
  libc6-compat \
  curl \
  git \
  python3 \
  make \
  g++ \
  wkhtmltopdf 

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "start:dev" ]

FROM node:20-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
