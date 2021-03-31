

var lURLs = `
https://t0.gstatic.com/images?q=tbn:ANd9GcSSEiivIFlXVtfx-HACixuH_MQhCnE6WCvVY0xXaU3IUeB6Zn_Hnx4vU9M93_3UTJuwUJJm3alRSmBXil9Ytd87eNR-Vd0
img/green_doctor.png
https://t2.gstatic.com/images?q=tbn:ANd9GcQHtSaRRqyHef86Ro0XM1OMxy3GiCDrkMMulyDcwR-TKGn0A1HSR2XdX40eDgo3Fzqdv50m5L_AynTT0AMtcd3hUR4V4tE
https://t2.gstatic.com/images?q=tbn:ANd9GcTLX4VIHOsKhBguATzzdV5Kg7ihYKyJck4NwL99QHsJVYXLSUyGjlIhNx-E-ods9PX3jE63lqIbPyHkE6fkAg3d0E67kT8
https://t2.gstatic.com/images?q=tbn:ANd9GcQZPiF-VHrULi0bKPhs2TGZii2w2qxOB5ZelNEyZJfsKGzhnHG-lPV-zprsZzZA4PEYZifZwCy0hGFfW-19C0CjqBk1b5M
img/blue_doctor.jpg
`.trim().split('\n')


var rURLs = `
https://t3.gstatic.com/images?q=tbn:ANd9GcQxmefgt4aedTa-VZ7pMHg03KC69LZhKXSOLu07ou_m7DRNf2NXO1K1c-VQKp5ML5SaSOcjAWs1W31Swhl-XqtF6wPqtVM
https://t1.gstatic.com/images?q=tbn:ANd9GcQrK6SD6AgFfZlJcdrHhcAzTQSpWmf87ZvAA8DsTOpzwg2SSiKk9VrmA5VhifqVbwt4SgP3B7cFdB8In6NKNs1Q7nAelpU
https://t0.gstatic.com/images?q=tbn:ANd9GcRKKOqUJFlhC6YgQuAj2hdtVo5w5ECn3AuxoiW7LaA5lJ1lIiq_-3E4KawdIlw-PwWtkKw_JlSnmKTrQkCl6RyesIkCyy8
https://t3.gstatic.com/images?q=tbn:ANd9GcSWWF8gHxW5dwQwdE7rMh_1SpZMYQQsdGWiVpP7t9AAE8VqvkSx-eoUDBdYQDFWBFL8al-V-eBj31s9gBT1uAKhF0oUadY
https://t0.gstatic.com/images?q=tbn:ANd9GcQd7Ei5AVNto3nnYt42emewwcEB9lach1RQjZ4ZMEl6OstsETx2vCiXNcjg2LTebmom7LyONPl8JdFTL1bijNqzJQdeKeA
https://t3.gstatic.com/images?q=tbn:ANd9GcTNSgZatcNL4gljUXbJrJlZdiPdKw-19WenvgOXETPta-40MxPKimy_Kj-ZW_ReexpwG8NoL7cZGU0Ww4iuV81CLGxweSY
https://t0.gstatic.com/images?q=tbn:ANd9GcTo8WAwPIjOv9PPcjd6iu_jambnY1jG8uiif4Fqr7XTruY4RJQOhRRH02Ea0znWEVovtsBfa2Z9gvF9Y9ZeyytCtz8v8a0
`.trim().split('\n')


var constructionSel = d3.select('#construction')
  .html('')

// constructionSel.append('div.top').each(function(){
//   var metrics = [{str: 'Male', key: 'Male', target: .5}]
//   var active ={ percents: {Male: .5}}
//   addMetrics(metrics, {topSel: d3.select(this).append('div.top'), active, isSmall: true})()
// })

constructionSel.append('img')
  .at({src: 'img/construction.jpg', width: 900})

constructionSel.append('div')
  .st({fontWeight: 500, fontSize: 14})
  .text('Stock “construction worker” images')




var width = 400
var coatDivs = d3.select('#coat-v-gender').html('').st({marginBottom: 40})
  .appendMany('div', [lURLs, rURLs])
  .st({width: width, display: 'inline-block', marginRight: 20})


coatDivs.each(function(d, i){
  var metrics = [
    {str: 'Blue', key: 'Blue', target: .5},
    {str: 'Male', key: 'Male', target: .5},
  ]

  var active = !i ? {percents: {Blue: .5, Male: 1}} : {percents: {Blue: 0, Male: .5}}

  addMetrics(metrics, {topSel: d3.select(this).append('div.top'), active, isSmall: true})()
})

coatDivs
  .st({fontWeight: 500, fontSize: 14})
  .appendMany('div', d => d.slice(0, 6))
  .st({backgroundImage: d => 'url(' + d + ')', width: width/3 - 10, height: 100, display: 'inline-block'})
  .st({marginRight: 8, outline: '1px solid #000'})

coatDivs
  .append('div')
  .text((d, i) => d == lURLs ? 'Male-presenting doctors wearing different colored clothes' : 'Doctor of different genders wearing white clothes')





// https://t3.gstatic.com/images?q=tbn:ANd9GcRziJdedqu58HeAlI9xtWhrVtCjVo6xO_uSHdQkxAI0q41XozLWT3xKd36S1NbuSoIOVvV4Huw26zAvdM_374qKuN9J88E