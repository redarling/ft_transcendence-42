FROM node:18 AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

RUN npm run build

FROM nginx:1.25.2

RUN openssl req -x509 -nodes -days 365 -newkey \
    rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out \
    /etc/ssl/certs/nginx-selfsigned.crt -subj "/CN=localhost"

COPY default.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html

COPY --from=build /app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]