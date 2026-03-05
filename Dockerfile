FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --production=false

# Copy source and build
COPY . .
RUN npm run build

# Expose port
EXPOSE 5000

# Start
CMD ["npm", "run", "start"]
ARG CACHEBUST=1772721146
