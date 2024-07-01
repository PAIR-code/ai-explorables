# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.9-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

# Copy requirements.txt to the docker image and install packages
COPY requirements.txt /
RUN pip install --require-hashes -r requirements.txt

# Download models
ADD https://storage.googleapis.com/uncertainty-over-space/zari-bert-cda/pytorch_model.bin zari-bert-cda/pytorch_model.bin
ADD https://huggingface.co/bert-large-uncased-whole-word-masking/resolve/main/pytorch_model.bin bert-large-uncased-whole-word-masking/pytorch_model.bin

# Run the web service on container startup.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 1 --timeout 0 main:app
