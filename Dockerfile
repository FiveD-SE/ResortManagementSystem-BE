# Development stage
FROM node:lts-alpine as development

# Install wkhtmltopdf and its dependencies
RUN apk add --no-cache \
  wkhtmltopdf \
  # Dependencies required for wkhtmltopdf
  libstdc++ \
  libx11 \
  libxrender \
  libxext \
  libssl1.1 \
  ca-certificates \
  fontconfig \
  freetype \
  ttf-dejavu \
  ttf-droid \
  ttf-freefont \
  ttf-liberation

WORKDIR /usr/src/app

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]

# Production stage
FROM node:20-alpine as production

# Install wkhtmltopdf and its dependencies
RUN apk add --no-cache \
  wkhtmltopdf \
  # Dependencies required for wkhtmltopdf
  libstdc++ \
  libx11 \
  libxrender \
  libxext \
  libssl1.1 \
  ca-certificates \
  fontconfig \
  freetype \
  ttf-dejavu \
  ttf-droid \
  ttf-freefont \
  ttf-liberation

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY --from=development /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]