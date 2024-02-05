FROM node:21.6.1-alpine3.18
# Set the working directory in the container
WORKDIR /usr/src/app
# Copy the current directory contents into the container at /app
COPY package.json ./
# Install dependencies
RUN npm install
# Copy the rest of the application code to the working directory
COPY . .
# Generate prisma client
RUN npx prisma generate
# Expose the port that the app will run on
EXPOSE 4000
# Run the app when the container launches
CMD ["npm", "start"] 
