/* Copyright 2020 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

window.initMobileScaling = function () {
  window.graphics = [
    {
      sel: d3.select('.playground-top'),
      ariaLabel:
        'Animated digram showing ten people periodically merging their 2D classifer models to collaboratively train a shared model — all without sharing their data.',
    },
    {
      sel: d3.select('.central-spam-model'),
      ariaLabel:
        'Diagram of a simple spam detection where every user text message is uploaded to a central server. The server computes how often four words — "cake", "pie", "soda" and "tea" — appear in spam and non-spam messages to build spam model. "Pie" messages are frequently spam in this toy example and the model correctly predicts that.',
    },
    {
      sel: d3.select('.local-spam-model'),
      ariaLabel: `In the local spam model, each of the three users uses only their local data to train a model. Despite their messages being drawn from the same distribution, each of the three users end up making very different models. There isn't enough data locally to train a model without high variance.`,
    },
    {
      sel: d3.select('.federated-spam-model'),
      ariaLabel: `Averaging the three users' local models gives better performance, but the logs of the central server still contain each of the locally trained models.`,
    },
    {
      sel: d3.select('.secure-aggregation'),
      ariaLabel: `
      Diagram sketching out three steps in secure aggregation, with the following captions

      Step 1: Alice, Bob and Carol want to find the sum of all their hidden numbers without revealing them to anyone else.,

      Step 2: Alice & Bob meet in private and pick a random number. Alice saves the random number and Bob saves the random number with the sign flipped. 
      Bob & Carol and Carol & Alice do the same.

      Step 3: Everyone secretly adds up their hidden number and saved random numbers, then sends the result to a central server. Summing up all results on the server, the pairs of random number cancel out and the total of the hidden numbers is left over.,`,
    },
    {
      sel: d3.select('.secure-federated-spam-model'),
      ariaLabel: `Diagram showing how passing each user model through a secure aggregation step first prevents the central server know about a particular user's messages`,
    },
    {
      sel: d3.select('.data-map-users > div'),
      ariaLabel:
        'Grid of 16 users, each represented by a scatter plot of hot and cold points. Each has only made three temperature observations.',
    },
    {
      sel: d3.select('.data-map-all-points > div'),
      ariaLabel: `All the data points from the 16 users overlaid on a single scatter plot. Hot, orange points only appear in the upper left; Cold, purple points only appear in the bottom right.`,
    },
    {
      sel: d3.select('.playground-step'),
      ariaLabel: `Grid of 16 users training models with only local data. Some users train models that closely match the actual pattern in temperatures; other users train very inaccurate models. Clicking the merge model button increases average accuracy.`,
    },
    {
      sel: d3.select('.playground-outlier'),
      ariaLabel:
        '6 of the 16 users report only cold points everywhere; removing them from training improves average accuracy.',
    },
    {
      sel: d3.select('.playground-dp'),
      ariaLabel:
        '16 users with 1 outlier. Adding noise to the training data makes it harder to distinguish between training with and without an outlier',
    },
    {
      sel: d3.select('.playground-full'),
      ariaLabel:
        'FL training playground with options to adjust training points, merge frequency, outliers, DP noise and the number of users.',
      isFullPlayground: true,
    },
  ];

  graphics.measure = function (d) {
    d.sel
      .st({transform: '', height: ''})
      .st({overflow: 'visible'})
      .at({role: 'graphics-document', 'aria-label': d.ariaLabel});

    d.width = d.sel.node().clientWidth;
    d.height = d.sel.node().clientHeight;
  };
  graphics.forEach(graphics.measure);

  graphics.rescale = function () {
    graphics.forEach((d) => {
      var scale = d3.clamp(0, (window.outerWidth - 10) / d.width, 1);

      d.sel.st({
        transform: `scale(${scale})`,
        transformOrigin: 'left top',
        height: d.height * scale,
      });

      // if (scale == 1) return
      var svgTextSel = d.sel
        .selectAll('.axis,text')
        .st({fontSize: 'auto'})
        .at({fontSize: 'auto'});
      // window.__textInterval?.stop()
      // window.__textInterval = d3.interval(() => d.sel.selectAll('text').st({fontSize: 10}), 200)
    });
  };
  graphics.rescale();
  d3.select(window).on('resize', _.debounce(graphics.rescale, 200));
  d3.select(window).on('focus', () => {
    // graphics.rescale()
    setTimeout(() => {
      d3.text('mobile-scale.js', (err, str) => {
        eval(str);
      });
    }, 200);
  });
};
window.initMobileScaling();

setTimeout(() => {
  Array.from(document.querySelectorAll('link'))
    .filter((d) => d.href.includes('playground/style.css'))
    .forEach((d) => (d.href = d.href.split('?')[0] + '?' + Math.random()));

  // setTimeout(() => {
  //   window.initMobileScaling()
  // }, 50)
}, 100);

// if (innerWidth < 800){
//   setTimeout(initMobileScaling, 1000)
//   setTimeout(initMobileScaling, 3000)
//   // window.__mobileInterval?.stop()
//   // window.__mobileInterval = d3.interval(initMobileScaling, 500)
// }
