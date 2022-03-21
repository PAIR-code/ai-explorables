window.thresholds = [0, 0.2, 0.4, 0.6, 0.8, 1];  
window.emojis = ['☀️','🌧️'];
window.constant_score = 0.5;

window.ttSel = d3.select('body').selectAppend('div.tooltip.tooltip-hidden')


window.init = function(){

    var graphSel = d3.select('#graph')
    var width = height = graphSel.node().offsetWidth
    if (innerWidth <= 925){
        width = innerWidth
        height = innerHeight*.65
        window.isMobile = true
    }
    fig_height = height/2
    fig_width = width


    window.util = window.initUtil()
    window.weatherGraph = window.drawWeatherGraph(graphSel, fig_height, fig_width);
    window.calibrationCurve = window.drawCalibrationCurve(graphSel, fig_height, fig_width);
    // window.calibrationSlider = window.drawCalibrationSlider(weatherGraph, calibrationCurve, fig_width/2)
    // window.modelRemapper = window.drawModelRemapping(fig_width/2);


    window.slides = window.drawSlides()
    weatherGraph.renderThresholds()

}

window.init()



