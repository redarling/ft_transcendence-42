FROM node:18 AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend files
COPY frontend/ ./

# Build the project
RUN npm run build

FROM nginx:1.25.2

# Generate self-signed SSL certificate
RUN openssl req -x509 -nodes -days 365 -newkey \
    rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out \
    /etc/ssl/certs/nginx-selfsigned.crt -subj "/CN=localhost"

# Copy Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Set correct permissions
RUN chmod -R 755 /usr/share/nginx/html

# Copy built files to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]