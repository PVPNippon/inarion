# Use the official Node.js image from the Docker Hub as the base image
FROM node:16

# Create and set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Install Google Cloud SDK
RUN apt-get update && apt-get install -y lsb-release && \
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    apt-get install -y apt-transport-https ca-certificates gnupg && \
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
    apt-get update && apt-get install -y google-cloud-sdk


# Copy the rest of the application files to the working directory
COPY . .

# Copy the service account key file
COPY /keys/sa-key.json /usr/src/app/sa-key.json

# Authenticate gcloud SDK using the service account key
RUN gcloud auth activate-service-account --key-file=/usr/src/app/sa-key.json

# Expose the port the application will run on


ENV PORT 4000
EXPOSE $PORT

# Command to run the application
CMD ["npm", "run", "dev"]
