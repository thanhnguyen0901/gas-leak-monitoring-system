FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:3000
ARG VITE_APP_TOKEN=
ENV VITE_API_URL=$VITE_API_URL VITE_APP_TOKEN=$VITE_APP_TOKEN
RUN npm run build
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
