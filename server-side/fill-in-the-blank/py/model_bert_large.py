import torch
import json
import numpy as np

from transformers import (BertForMaskedLM, BertTokenizer)

modelpath = 'bert-large-uncased-whole-word-masking/'
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


def get_embedding_group(tokens):
  print(tokens)

  mutated = []
  for i, v in enumerate(tokens):
    array = tokens.copy()
    array[i] = id_of_mask
    mutated.append(array)

  print('Running model')
  output = model(torch.tensor(mutated))[0]

  print('Converting to list')
  array = output.detach().numpy().tolist()

  print('Constructing out array')
  # only grab mask embedding
  # can probaby do this in torch? not sure how
  out = []
  for i, v in enumerate(array):
    out.append(v[i])

  return out

def get_embedding_group_top(tokens):
  sents = get_embedding_group(tokens)
  out = []

  print('get_embedding_group done')

  for sent_i, sent in enumerate(sents):
    all_tokens = []

    for i, v in enumerate(sent):
      all_tokens.append({'i': i, 'v': float(v)})

    all_tokens.sort(key=lambda d: d['v'], reverse=True)

    topTokens = all_tokens[:90]

    sum = np.sum(np.exp(sent))
    for i, token in enumerate(topTokens):
      token['p'] = float(np.exp(token['v'])/sum)

    out.append(all_tokens[:90])

  return out


# Runs one token at a time to stay under memory limit
def get_embedding_group_low_mem(tokens):
  print(tokens)

  out = []
  for index_of_mask, v in enumerate(tokens):
    array = tokens.copy()
    array[index_of_mask] = id_of_mask

    input_ids = torch.tensor(array).unsqueeze(0)
    prediction_scores = model(input_ids)[0]

    out.append(prediction_scores[0][index_of_mask].detach().numpy())

  return out

def get_embedding_group_top_low_mem(tokens):
  sents = get_embedding_group_low_mem(tokens)
  out = []

  print('get_embedding_group done')

  for sent_i, sent in enumerate(sents):
    all_tokens = []

    for i, v in enumerate(sent):
      all_tokens.append({'i': i, 'v': float(v)})

    all_tokens.sort(key=lambda d: d['v'], reverse=True)

    topTokens = all_tokens[:90]

    sum = np.sum(np.exp(sent))
    for i, token in enumerate(topTokens):
      token['p'] = float(np.exp(token['v'])/sum)

    out.append(all_tokens[:90])

  return out


import os
import shutil

# Free up memory 
if os.environ.get('REMOVE_WEIGHTS') == 'TRUE':
  print('removing bert-large-uncased-whole-word-masking from filesystem')
  shutil.rmtree('bert-large-uncased-whole-word-masking', ignore_errors=True)
