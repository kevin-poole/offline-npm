FROM node
WORKDIR /app
COPY ["package.json", "package-lock.json*", "worker.js", "./"]
RUN npm install --production
CMD ["node", "worker.js"]