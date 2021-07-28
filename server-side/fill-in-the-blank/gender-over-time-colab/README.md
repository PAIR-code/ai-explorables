- https://colab.research.google.com/notebooks/snippets/advanced_outputs.ipynb

````
ls *.* | entr rsync -a --omit-dir-times --no-perms --exclude node_modules "$PWD" demo@roadtolarissa.com:../../usr/share/nginx/html/colab/
````