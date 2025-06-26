FROM node:20

WORKDIR /app

# Copy only package.json and lock file first to optimize caching
COPY package*.json ./

RUN npm install

# Then copy the rest of the code
COPY . .

EXPOSE 3000

# Use nodemon for hot-reloading in development
CMD ["npm", "run", "dev"]
