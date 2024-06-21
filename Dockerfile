FROM node
WORKDIR /receipt-processor
COPY package.json package-lock.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]