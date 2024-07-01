function watchFile(path, type) {
  var lastStr = '';

  console.log(path);
  function check() {
    d3.text(path + '?' + Math.random(), (err, nextStr) => {
      if (err) {
        console.log(err);
        return check();
      }

      if (nextStr == lastStr) return;
      lastStr = nextStr;

      if (path.includes('.js')) {
        console.clear();
        console.log('js', new Date());

        Function(nextStr.replace('\n', ';').replace('\n', ';'))();
      }

      if (path.includes('.css')) {
        console.log('css', new Date());

        Array.from(document.querySelectorAll('link'))
          .filter((d) => d.href.includes(path))
          .forEach(
            (d) => (d.href = d.href.split('?')[0] + '?' + Math.random()),
          );
      }
    });

    setTimeout(check, window.timeoutMS || 9999999999);
  }
  check();
}

watchFile(
  'https://roadtolarissa.com/colab/gender-over-time-colab/style.css',
  'js',
);
watchFile(
  'https://roadtolarissa.com/colab/gender-over-time-colab/script.js',
  'js',
);
