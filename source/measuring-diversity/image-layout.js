var lURLs = `
img/green_doctor.png
img/blue_doctor.jpg
img/green0.png
img/bright_blue.png
img/blue0.png
img/blue1.png
`
  .trim()
  .split('\n');

var rURLs = `
img/white0.png
img/white1.png
img/white2.png
img/white3.png
img/white4.png
img/white5.png
`
  .trim()
  .split('\n');

var constructionSel = d3.select('#construction').html('');

// constructionSel.append('div.top').each(function(){
//   var metrics = [{str: 'Male', key: 'Male', target: .5}]
//   var active ={ percents: {Male: .5}}
//   addMetrics(metrics, {topSel: d3.select(this).append('div.top'), active, isSmall: true})()
// })

constructionSel.append('img').at({src: 'img/construction.jpg', width: 900});

constructionSel
  .append('div')
  .st({fontWeight: 500, fontSize: 14})
  .text('Stock “construction worker” images');

var width = 400;
var coatDivs = d3
  .select('#coat-v-gender')
  .html('')
  .st({marginBottom: 40})
  .appendMany('div', [lURLs, rURLs])
  .st({width: width, display: 'inline-block', marginRight: 20});

coatDivs.each(function (d, i) {
  var metrics = [
    {str: 'Blue', key: 'Blue', target: 0.5},
    {str: 'Male', key: 'Male', target: 0.5},
  ];

  var active = !i
    ? {percents: {Blue: 0.5, Male: 1}}
    : {percents: {Blue: 0, Male: 0.5}};

  addMetrics(metrics, {
    topSel: d3.select(this).append('div.top'),
    active,
    isSmall: true,
  })();
});

coatDivs
  .st({fontWeight: 500, fontSize: 14})
  .appendMany('div', (d) => d.slice(0, 6))
  .st({
    backgroundImage: (d) => 'url(' + d + ')',
    width: width / 3 - 10,
    height: 100,
    display: 'inline-block',
  })
  .st({marginRight: 8, outline: '1px solid #000'});

coatDivs
  .append('div')
  .text((d, i) =>
    d == lURLs
      ? 'Male-presenting doctors wearing different colored clothes'
      : 'Doctor of different genders wearing white clothes',
  );

// https://t3.gstatic.com/images?q=tbn:ANd9GcRziJdedqu58HeAlI9xtWhrVtCjVo6xO_uSHdQkxAI0q41XozLWT3xKd36S1NbuSoIOVvV4Huw26zAvdM_374qKuN9J88E
