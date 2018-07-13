# note that order matters in terms of docker build layers. Least changed near start to most changed...
# This image will be based on the official nodejs docker image
FROM beevelop/nodejs-python:latest

EXPOSE 80
ENV PORT 80

# Commands will run in this directory
RUN mkdir /srv/app
WORKDIR /srv/app

# # Install some Python stuffs.
# RUN apt-get update && \
#   apt-get install -y python python-dev python-pip python-virtualenv nodejs npm && \
#   rm -rf /var/lib/apt/lists/*

# Add build file
COPY ./package.json package.json

# Install dependencies and generate production dist
ARG NPM_TOKEN
COPY .npmrc-deploy .npmrc
RUN npm install
RUN rm -f .npmrc

# Python setup.
COPY requirements.txt requirements.txt
# RUN pip --version
RUN pip install --no-cache-dir -r requirements.txt

# Copy the code for the prod container.
# This seems to not cause any problems in dev when we mount a volume at this point.
COPY ./app app
COPY ./config config
COPY ./topicmodels topicmodels

CMD npm start
