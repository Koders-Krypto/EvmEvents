# Build Pipeline
FROM node:18.12.1 As development

WORKDIR /usr/src/app

COPY package.json ./

COPY package-lock.json ./

RUN npm install

COPY . .

RUN npm run build


# Production Pipeline
FROM node:18.12.1 as production

ARG NODE_ENV=production

ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN ls /usr/src/app

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/index.js"]
