
function createPhotoScroller(){

    var base_path = 'img/woman_washing_clothes.jpeg'
    var data = [
        {
            'path': 'img/labels_1.svg',
            'alt': 'Image of a woman washing clothes with bounding boxes including \'person\', and \'bucket\'',
            'x': 198,
            'y': 30,
            'width': 305,
            'height': 400,
        },

             {
            'path': 'img/labels_4.svg',
            'alt': 'Image of a woman washing clothes with bounding boxes including \'parent\', and \'laundry\'',
            'x': 110,
            'y': 60,
            'width': 450,
            'height': 470,
        },


        {
            'path': 'img/labels_2.svg',
            'alt': 'Image of a woman washing clothes with bounding boxes including \'hair_boho\', and \'decor_outdoor_rustic\'',
            'x': 198,
            'y': -35,
            'width': 395,
            'height': 500
        },  

                    {
            'path': 'img/labels_3.svg',
            'alt': 'Image of a woman washing clothes with one bounding box around her, labeled \'pedestrian\'',
            'x': 190,
            'y': 65,
            'width': 190,
            'height': 315
        },   
    ];


    var photoIndex = 0;

    var c = d3.conventions({
      sel: d3.select('.person-photos').html(''),
      height: 550
    })

    var photoSel = c.svg.append('svg:image')
        .attr('x', 50)
        .attr('y', 50)
        .attr('width', 700)
        .attr('height', 500)
        .attr('xlink:href', base_path)

    var photoSel = c.svg.appendMany('svg:image', data)
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('xlink:href', d => d.path)
        .attr('alt', d => d.alt)


    var buttonHeight = 35
    var buttonWidth = 130

    var buttonSel = c.svg.appendMany('g.photo-button', data)
        .translate((d,i) => [(i * 170) + 100, 0])
        .at({
            // class: "dropdown"
        })
        .on('click', function(d, i){
            photoIndex = i
            setActiveImage()
            timer.stop();
        })

    buttonSel.append('rect')
        .at({
            height: buttonHeight,
            width: buttonWidth,
            // fill: '#fff'
        })

    buttonSel.append('text')
        .at({
            textAnchor: 'middle',
            // dominantBaseline: 'central',
            dy: '.33em',
            x: buttonWidth/2,
            y: buttonHeight/2,
            class: "monospace"
        })
        .text((d,i) => 'ground truth ' + (i + 1))

    // buttonSel.classed('dropdown', true);

    if (window.__photoPersonTimer) window.__photoPersonTimer.stop()
    var timer = window.__photoPersonTimer = d3.interval(() => {
        photoIndex = (photoIndex + 1) % data.length;
        setActiveImage()
    }, 2000)

    function setActiveImage(i){
        photoSel.st({opacity: (d, i) => i == photoIndex ? 1 : 0 })
        buttonSel.classed('is-active-button', (d, i) => i == photoIndex)
    }
    setActiveImage()
}

createPhotoScroller();




