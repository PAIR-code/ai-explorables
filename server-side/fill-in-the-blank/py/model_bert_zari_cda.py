import torch
import json
import numpy as np

from transformers import (BertForMaskedLM, BertTokenizer)

modelpath = 'zari-bert-cda/'
tokenizer = BertTokenizer.from_pretrained(modelpath)
model = BertForMaskedLM.from_pretrained(modelpath)
model.eval()

id_of_mask = 103

def get_embeddings(sentence):
  with torch.no_grad(): 
    processed_sentence = '' + sentence + ''
    tokenized = tokenizer.encode(processed_sentence)
    input_ids = torch.tensor(tokenized).unsqueeze(0)  # Batch size 1
    outputs = model(input_ids)
    index_of_mask = tokenized.index(id_of_mask)

    # batch, tokens, vocab_size
    prediction_scores = outputs[0]

    return prediction_scores[0][index_of_mask].cpu().numpy().tolist()



import os
import shutil

# Free up memory 
if os.environ.get('REMOVE_WEIGHTS') == 'TRUE':
  print('removing zari-bert-cda from filesystem')
  shutil.rmtree('zari-bert-cda', ignore_errors=True)
