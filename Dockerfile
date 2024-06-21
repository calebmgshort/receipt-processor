FROM node
WORKDIR /receipt-processor
COPY package.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]