FROM ethereum/client-go:stable

EXPOSE 8545

WORKDIR /blockchain

COPY . .

RUN chmod -R 777 /blockchain/data

CMD ["geth"]