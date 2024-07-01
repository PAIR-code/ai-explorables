/* Copyright 2021 Google LLC. All Rights Reserved.

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

window.initScatter = function (c) {
  var rv = {data: [], cur_t: 0};

  var duration = 1;
  if (!c.scatters) c.scatters = [rv];

  var [svgbot, ctx, divSel, svg] = c.layers;

  var regl = createREGL({
    container: divSel.node(),
    // attributes: {antialias: false},
  });

  // https://blocks.roadtolarissa.com/1wheel/0a58f8bf5a14f6a534b9043a9c63dd1d
  // https://peterbeshai.com/blog/2017-05-26-beautifully-animate-points-with-webgl-and-regl/
  function drawRegl() {
    var {data} = rv;
    var t0 = performance.now();

    var tmpData = [
      {x: 0, y: 0},
      {x: 0.5, y: 0.5},
      {x: 1, y: 1},
      {x: -1, y: -1},
    ];

    var drawPoints = regl({
      vert: `
        precision mediump float;
        attribute float x, y, px, py, isVisible;

        attribute vec3 color;
        varying vec3 fragColor;

        uniform float interp;      
        void main() {
          float xPos = isVisible < .5 ? -2.0 : mix(px, x, interp);
          // float xPos = mix(px, x, interp);
          float yPos = mix(py, y, interp);
          gl_Position = vec4(xPos, yPos, 0, 1);

          gl_PointSize = ${devicePixelRatio > 3 ? 7 : devicePixelRatio > 1 ? 5 : 2}.0;

          fragColor = color;
        }`,
      frag: `
        precision mediump float;
        varying vec3 fragColor;
        void main() {
          gl_FragColor = vec4(fragColor, 1.0);
        }`,

      attributes: {
        x: data.map((d) => (d.x / c.width) * 2 - 1),
        y: data.map((d) => (-d.y / c.height) * 2 + 1),
        px: data.map((d) => (d.p.x / c.width) * 2 - 1),
        py: data.map((d) => (-d.p.y / c.height) * 2 + 1),
        color: data.map((d) => d.color),
        isVisible: data.map((d) => (c.type != 'c' || d.isVisible ? 1 : 0)),
      },
      uniforms: {
        interp: (ctx, props) => props.interp,
      },
      primitive: 'point',
      count: data.length,
    });

    drawPoints({interp: 0});

    if (rv.regltick) rv.regltick.cancel();
    rv.regltick = regl.frame(({time}) => {
      var dt = performance.now() - t0 + 8;
      var interp = d3.easeCubic(d3.clamp(0, dt / duration, 1));

      drawPoints({interp});
      if (1 == interp && rv.regltick) rv.regltick.cancel();

      // c.svg.selectAppend('text.debug').text(dt + ' ' + interp)
    });
  }

  var centerPathSel = c.svg
    .selectAppend('path.center')
    .st({pointerEvents: 'none', strokeWidth: 0.3, stroke: '#ccc'});

  rv.draw = function (c, data, isxy) {
    rv.pData = rv.data;
    rv.data = data;

    if (!rv.pData.length) rv.pData = rv.data;

    data.forEach((d, i) => {
      d.prettyWord = d.word.replace('▁', '');
      d.color = util.color2array(d.fill);
      // console.log(d.color)
      d.i = i;
      d.p = rv.pData[i];
      if (!d.p) debugger;
      // ctx.fillStyle = d.fill
      // ctx.fillRect(d.x - d.s/2, d.y - d.s/2, d.s, d.s)
    });

    var tinyTextSel = svg.selectAll('text.tiny').data(
      data.filter((d) => d.show),
      (d) => d.word,
    );

    tinyTextSel
      .exit()
      .transition()
      .duration(duration)
      .translate((d) => [rv.data[d.i].x, rv.data[d.i].y])
      .at({fill: (d) => d.fill, opacity: 0})
      .remove();

    tinyTextSel
      .enter()
      .append('text.tiny')
      .text((d) => d.prettyWord)
      .at({
        dy: (d) => (d.show[0] == 'u' ? -2 : 10),
        dx: (d) => (d.show[1] == 'r' ? 2 : -2),
        textAnchor: (d) => (d.show[1] == 'r' ? '' : 'end'),
        fill: (d) => d.p.fill,
        opacity: 0,
      })
      .translate((d) => [d.p.x, d.p.y])
      .merge(tinyTextSel)
      .transition()
      .duration(duration)
      .translate((d) => [d.x, d.y])
      .at({fill: (d) => d.fill, opacity: 1});

    c.svg
      .transition()
      .duration(duration)
      .attrTween('cur_t', function () {
        rv.cur_t = 0;
        drawRegl();

        return (t) => {
          rv.cur_t = t;
        };
      });

    centerPathSel
      .raise()
      .transition()
      .duration(duration) //.ease(d3.easeQuadIn)
      .at({
        d: isxy
          ? ['M', 0, c.height, 'L', c.width, 0].join(' ')
          : ['M', 0, c.y(0) + 0.5, 'L', c.width, c.y(0) + 0.5].join(' '),
      });

    setTimeout(() => (duration = c.scatters.length > 1 ? 600 : 600), 1);

    // svg.appendMany('text.tiny', data.filter(d => d.show))
    //   .text(d => d.prettyWord)
    //   .translate(d => [d.x, d.y])
    //   .at({
    //     dy: d => d.show[0] == 'u' ? -2 : 10,
    //     dx: d => d.show[1] == 'r' ? 2 : -2,
    //     textAnchor: d => d.show[1] == 'r' ? '' : 'end',
    //     fill: d => d.fill,
    //   })
  };

  function addHover() {
    var curHover = '';
    var hoverSel = svg
      .append('g.hover')
      .st({opacity: 0, pointerEvents: 'none'});

    hoverSel.append('circle').at({r: 5, fill: 'none', stroke: '#000'});

    var hoverTextSel = hoverSel
      .appendMany('text', [0, 1])
      .at({x: 10, y: 5, stroke: (d) => (d ? '' : '#000')})
      .st({fontFamily: 'monospace'});

    svg
      .append('rect')
      .at({width: c.width, height: c.height, fill: 'rgba(0,0,0,0)'});

    svg
      .on('mousemove', function () {
        var [x, y] = d3.mouse(this);

        var match = _.minBy(
          rv.data.filter((d) => d.isVisible),
          (d) => {
            var dx = x - d.x;
            var dy = y - d.y;

            return dx * dx + dy * dy;
          },
        );

        if (match && curHover != match.word) setHoverAll(match.word);
      })
      .on('mouseout', function () {
        curHover = null;
        setHoverAll(null);
      });

    function setHoverAll(word) {
      c.scatters.forEach((d) => d.setHover(word));
    }

    rv.setHover = (word) => {
      var d = _.find(rv.data, {word});
      if (!d) {
        hoverSel.st({opacity: 0});
        hoverTextSel.text('');
        return;
      }
      curHover = word;

      hoverSel.translate([d.x, d.y]).raise().st({opacity: 1});
      hoverTextSel.text(d.prettyWord);
    };
  }
  addHover();

  return rv;
};

if (window.init) init();
