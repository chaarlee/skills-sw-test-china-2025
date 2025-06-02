FROM node:alpine

EXPOSE 2345

COPY ../service/ /opt/

WORKDIR /opt

RUN chmod 777 . && npm install

CMD ["node", "index.js"]
