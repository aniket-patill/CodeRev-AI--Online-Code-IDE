FROM node:20-bullseye

# Install compilers and Java
RUN apt-get update && \
    apt-get install -y \
    build-essential \
    openjdk-17-jdk \
    python3 \
    python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
