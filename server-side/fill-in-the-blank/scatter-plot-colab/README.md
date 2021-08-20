[BERT Difference Plots Colab](https://colab.research.google.com/github/PAIR-code/ai-explorables/blob/master/server-side/fill-in-the-blank/scatter-plot-colab/BERT_Difference_Plots.ipynb
)

### Dev

To edit the charts:

- Enable `isDev` in the python notebook `jsViz(data, {'type': 'two-sentences', 'isDev': 1})` 
- use `entr` and `rsync` to update the js/css in a location accessible to colab.

Example: 

````
find . | entr rsync -a --omit-dir-times --no-perms --exclude node_modules --exclude .git "$PWD" demo@roadtolarissa.com:../../usr/share/nginx/html/colab/
````

- https://colab.research.google.com/notebooks/snippets/advanced_outputs.ipynb
- https://blocks.roadtolarissa.com/1wheel/7361276a2af10ca48ec9550c33bbdad5
