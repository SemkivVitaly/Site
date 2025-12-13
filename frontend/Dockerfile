FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

# Установка ajv явно для исправления проблем с зависимостями
RUN npm install ajv@^8.17.1 --legacy-peer-deps --save-dev

COPY . .
ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

FROM nginx:alpine

# Копирование собранного приложения
COPY --from=build /app/build /usr/share/nginx/html

# Копирование конфигурации Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

