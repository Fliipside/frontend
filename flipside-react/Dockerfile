# Build the app, then serve the static files with nginx. Build context: this folder.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# The map data is generated from a pinned public source. It gets its own layer, before the
# app code, so it is downloaded again only when the script or the dependencies change.
COPY scripts ./scripts
RUN node scripts/build-map-data.mjs

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
