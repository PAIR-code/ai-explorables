# Python

## Setup

Install dependencies

```
python3 -m venv env
source env/bin/activate
pip install  -r py/requirements.txt
```

Download a copy of model weights

```
curl https://storage.googleapis.com/uncertainty-over-space/zari-bert-cda/pytorch_model.bin -o zari-bert-cda/pytorch_model.bin

curl https://huggingface.co/bert-large-uncased-whole-word-masking/resolve/main/pytorch_model.bin -0 bert-large-uncased-whole-word-masking/pytorch_model.bin
```

Start server

```
source env/bin/activate
cd py && python main.py
```

## Deploy

The `py` folder is bundled with docker and deployed to [Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/python).

```
cd py

gcloud builds submit --tag gcr.io/uncertainty-over-space/helloworld --project=uncertainty-over-space && gcloud run deploy --image gcr.io/uncertainty-over-space/helloworld --project=uncertainty-over-space
```

https://huggingface.co/blog/how-to-deploy-a-pipeline-to-google-clouds

