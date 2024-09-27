# Stage 1: Build the React application
FROM node:20 as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
# Fix permissions on node_modules
RUN chmod -R 755 /app/node_modules
RUN npm run build

# Stage 2: Serve the React application using Nginx
FROM nginx

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
