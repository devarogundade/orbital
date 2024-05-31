# Base image
FROM node:18
# Create app directory
WORKDIR /
# Install app dependencies
COPY package*.json ./
RUN npm install
# Bundle app source
COPY . .
RUN npm run build
# Expose port
EXPOSE 3000
# Start the application
CMD [ "node", "dist/index.js" ]
