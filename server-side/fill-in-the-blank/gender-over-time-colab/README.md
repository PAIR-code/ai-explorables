- https://colab.research.google.com/notebooks/snippets/advanced_outputs.ipynb
- https://blocks.roadtolarissa.com/1wheel/7361276a2af10ca48ec9550c33bbdad5


````
ls *.* | entr rsync -a --omit-dir-times --no-perms --exclude node_modules "$PWD" demo@roadtolarissa.com:../../usr/share/nginx/html/colab/
````