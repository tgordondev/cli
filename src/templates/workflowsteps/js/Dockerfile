############################
# Build container
############################
FROM node:12-stretch AS dep

# This is enforced because otherwise the code wouldn't get detected by the CLI
WORKDIR /ops

ADD package.json .
RUN npm install

ADD . .

############################
# Final container
############################
FROM registry.cto.ai/official_images/node:latest

WORKDIR /ops

COPY --from=dep /ops .
