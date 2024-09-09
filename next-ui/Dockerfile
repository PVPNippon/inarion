# Use official Node.js image as the base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 3000 for the Next.js app
EXPOSE 3000

# Set environment variables for custom port and host
# ENV PORT=3000
# ENV HOST=0.0.0.0

# Start the Next.js application
CMD ["npm", "run", "start"]