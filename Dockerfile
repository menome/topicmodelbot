FROM python:3.7.4-stretch

EXPOSE 80
ENV PORT 80
RUN apt-get update && \ 
  apt-get install -yqq apt-transport-https 
RUN echo "deb https://deb.nodesource.com/node_10.x jessie main" > /etc/apt/sources.list.d/nodesource.list && \
  wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list && \
  wget -qO- https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  apt-get update && \
  apt-get install -yqq nodejs yarn && \
  rm -rf /var/lib/apt/lists/*

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
