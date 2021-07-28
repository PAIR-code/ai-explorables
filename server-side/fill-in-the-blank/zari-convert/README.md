# Saves models to disk to package in dockerfile 

## zari-bert-cda

Converts [zari-bert-cda](https://github.com/google-research-datasets/Zari) to a Hugging Face model.

Download original model

```
mkdir raw
cd raw
curl https://storage.googleapis.com/bert_models/filbert/2020_10_13/zari-bert-cda.tar.gz -o zari-bert-cda.tar.gz
tar xvzf zari-bert-cda.tar.gz
```

Convert

```
source ../../env/bin/activate
transformers-cli convert --model_type bert \
  --tf_checkpoint zari-bert-cda/model.ckpt \
  --config zari-bert-cda/bert_config.json \
  --pytorch_dump_output zari-bert-cda/pytorch_model.bin

cp zari-bert-cda/bert_config.json zari-bert-cda/config.json
```

Copy to docker directory 

```
mkdir ../../py/zari-bert-cda

cp zari-bert-cda/config.json        ../../py/zari-bert-cda/config.json
cp zari-bert-cda/vocab.txt          ../../py/zari-bert-cda/vocab.txt
cp zari-bert-cda/pytorch_model.bin  ../../py/zari-bert-cda/pytorch_model.bin
```

## bert-large-uncased-whole-word-masking

```
cd ../py
source env/bin/activate
python model_bert_large_export.py
```

## Upload files

```
cd ../py

gsutil -o "GSUtil:parallel_process_count=1" -m rsync -r zari-bert-cda gs://uncertainty-over-space/zari-bert-cda
```

https://storage.googleapis.com/uncertainty-over-space/zari/zari-bert-cda/vocab.txt
