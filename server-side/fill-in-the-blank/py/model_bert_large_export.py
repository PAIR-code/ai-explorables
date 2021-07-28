from transformers import (BertForMaskedLM, BertTokenizer)

modelpath = 'bert-large-uncased-whole-word-masking'
model = BertForMaskedLM.from_pretrained(modelpath)

model.save_pretrained('./bert-large-uncased-whole-word-masking')




# from transformers import (BertForMaskedLM, BertTokenizer)

# modelpath = 'bert-large-uncased'
# model = BertForMaskedLM.from_pretrained(modelpath)

# model.save_pretrained('./bert-large-uncased')



