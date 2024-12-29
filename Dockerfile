FROM node:lts-alpine as development

WORKDIR /usr/src/app

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

COPY package*.json ./

RUN npm install -g @nestjs/cli && npm install glob rimraf && npm install

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]

FROM node:20-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY --from=development /usr/src/app/dist ./dist 

CMD [ "node", "dist/main.js" ]
