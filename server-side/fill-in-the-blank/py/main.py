import os
import json
import shutil

from flask import Flask, request
from flask_cors import CORS

import model_bert_large
import model_bert_zari_cda

app = Flask(__name__)
CORS(app)


@app.route('/')
def hello_world():
  name = os.environ.get('NAME', 'Test')
  print('[Hello]')
  return 'Hello {}!'.format(name)


@app.route('/embed_test')
def embed_test():
  sentence = 'The dog went to the [MASK].'
  print('[TEST] ', sentence)
  return json.dumps(model_bert_large.get_embeddings(sentence))


@app.route('/embed', methods=['POST'])
def embed():
  data = json.loads(request.data)
  sentence = data['sentence']
  print('[BASE] ' + sentence)
  return json.dumps(model_bert_large.get_embeddings(sentence))

@app.route('/embed_zari_cda', methods=['POST'])
def embed_zari_cda():
  data = json.loads(request.data)
  sentence = data['sentence']
  print('[ZARI] ' + sentence)
  return json.dumps(model_bert_zari_cda.get_embeddings(sentence))


@app.route('/embed_group_top', methods=['POST'])
def embed_group_top():
  data = json.loads(request.data)
  tokens = data['tokens']
  return json.dumps(model_bert_large.get_embedding_group_top(tokens))

@app.route('/get_embedding_group_top_low_mem', methods=['POST'])
def embed_group():
  data = json.loads(request.data)
  tokens = data['tokens']
  return json.dumps(model_bert_large.get_embedding_group(tokens))

if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5004)))


