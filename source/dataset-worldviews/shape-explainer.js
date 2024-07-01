console.clear();

var shapeScale = 0.6;

var keyedData = {
  pointiness_true: {
    name: 'pointiness_true',
    isRounding: true,
    categoryName: 'pointiness',
    categories: ['pointy', 'round'],
    textPlacements: {},
  },
  pointiness_false: {
    name: 'pointiness_false',
    isRounding: false,
    categoryName: 'pointiness',
    categories: ['pointy', 'round', 'other'],
    textPlacements: {},
  },
  shape_name_true: {
    name: 'shape_name_true',
    isRounding: true,
    categoryName: 'shape_name',
    categories: ['circle', 'triangle', 'rect'],
    textPlacements: {},
  },
  shape_name_false: {
    name: 'shape_name_false',
    isRounding: false,
    categoryName: 'shape_name',
    categories: ['circle', 'triangle', 'rect', 'other'],
    textPlacements: {},
  },
  size_true: {
    name: 'size_true',
    isRounding: true,
    categoryName: 'size',
    categories: ['small', 'large'],
    textPlacements: {},
  },
  size_false: {
    name: 'size_false',
    isRounding: false,
    categoryName: 'size',
    categories: ['small', 'large', 'other'],
    textPlacements: {},
  },
};

var data = [];
for (var key in keyedData) {
  data.push(keyedData[key]);
}

var state = {
  selected: data[0],
  selectedTopIndex: 0,
  selectedBottomIndex: 0,
};

function updateState(
  category,
  rounding,
  topIndex = undefined,
  bottomIndex = undefined,
) {
  var key = category + '_' + rounding;
  state.selected = keyedData[key];
  state.selectedTopIndex = topIndex;
  state.selectedBottomIndex = bottomIndex;
}

// Placements for the center labels
var textPlacements = {};

var divHeight = 720;
var divWidth = 850;

var c = d3.conventions({
  sel: d3.select('.shape-explainer').html(''),
  width: divWidth,
  height: divHeight,
  layers: 'ds',
});

var buttonHeight = 35;
var buttonWidth = 200;
var buttonBuffer = 15;
var topRightShift = 200;
var bottomRightShift = 270;

function setActiveButton() {
  topExplainerButtonSel.classed(
    'explainer-active-button',
    (d, i) => i == state.selectedTopIndex,
  );
  bottomExplainerButtonSel.classed(
    'explainer-active-button',
    (d, i) => i == state.selectedBottomIndex,
  );
}

// Preamble text
c.svg
  .append('text.top-explainer-text')
  .at({
    textAnchor: 'left',
    dominantBaseline: 'top',
    dy: '.33em',
  })
  .translate([0, buttonHeight / 2])
  .text('All shapes are basically...');

c.svg
  .append('text.bottom-explainer-text')
  .at({
    textAnchor: 'left',
    dominantBaseline: 'top',
    dy: '.33em',
  })
  .translate([0, buttonHeight * 1.5 + buttonBuffer])
  .text('Everything else should be labeled...');

// Buttons
var topExplainerButtonSel = c.svg
  .appendMany('g.explainer-button', ['pointiness', 'shape_name', 'size'])
  .at({})
  .translate((d, i) => [topRightShift + i * (buttonWidth + buttonBuffer), 0])
  .on('click', function (d, i) {
    updateState(
      d,
      state.selected.isRounding,
      (topIndex = i),
      (bottomIndex = state.selectedBottomIndex),
    );
    setActiveButton();
    moveShapes();
  });

topExplainerButtonSel.append('rect').at({
  height: buttonHeight,
  width: buttonWidth,
  class: 'explainer-rect',
});

topExplainerButtonSel
  .append('text')
  .at({
    textAnchor: 'middle',
    dy: '.33em',
    x: buttonWidth / 2,
    y: buttonHeight / 2,
    class: 'dropdown',
  })
  .text((d, i) => toShortValueStringDict[d]);

var bottomExplainerButtonSel = c.svg
  .appendMany('g.explainer-button', ['true', 'false'])
  .at({})
  .translate((d, i) => [
    bottomRightShift + i * (buttonWidth + buttonBuffer),
    buttonHeight + buttonBuffer,
  ])
  .on('click', function (d, i) {
    updateState(
      state.selected.categoryName,
      d,
      (topIndex = state.selectedTopIndex),
      (bottomIndex = i),
    );
    setActiveButton();
    moveShapes();
  });

bottomExplainerButtonSel.append('rect').at({
  height: buttonHeight,
  width: buttonWidth,
  class: 'explainer-rect',
});

bottomExplainerButtonSel
  .append('text')
  .at({
    textAnchor: 'middle',
    dy: '.33em',
    x: buttonWidth / 2,
    y: buttonHeight / 2,
    class: 'dropdown',
  })
  .text((d, i) => toDropdownValueRoundingStringDict[d]);

var horizontalHeight = divHeight * (5 / 8);
var horizontalBuffer = 50;

p = d3.line()([
  [horizontalBuffer, horizontalHeight],
  [divWidth - horizontalBuffer, horizontalHeight],
]);

var horizontal = c.svg
  .append('path')
  .at({
    d: p,
    stroke: 'black',
    strokeWidth: 1,
  })
  .translate([0, 0])
  .style('stroke-dasharray', '5, 5');

c.svg
  .append('text.label-correct')
  .at({
    x: -400,
    y: 90,
  })
  .text('correctly classified')
  .attr('transform', 'rotate(-90)');

c.svg
  .append('text.label-correct')
  .at({
    x: -630,
    y: 90,
  })
  .text('incorrectly classified')
  .attr('transform', 'rotate(-90)');

// Manually make some small adjustments to where particular shapes are placed
function getFineAdjustment(shape) {
  if (
    shape.shape_name == 'rt_rect' &&
    shape.correctness == 'incorrect' &&
    shape.gt == 'shaded'
  ) {
    return 4;
  }
  if (
    shape.shape_name == 'rect' &&
    shape.correctness == 'incorrect' &&
    shape.gt == 'unshaded'
  ) {
    return -10;
  }
  if (
    shape.shape_name == 'triangle' &&
    shape.correctness == 'incorrect' &&
    shape.gt == 'unshaded'
  ) {
    return 0;
  }
  if (
    shape.shape_name == 'rt_circle' &&
    shape.correctness == 'incorrect' &&
    shape.size == 'small'
  ) {
    return -20;
  }
  if (
    shape.shape_name == 'rt_triangle' &&
    shape.correctness == 'incorrect' &&
    shape.size == 'small'
  ) {
    return -20;
  }
  return 0;
}

function getFinalCategory(labelName, isRounding) {
  if (isRounding == true) {
    return labelName.replace('rt_', '');
  } else {
    if (labelName.includes('rt_')) {
      return 'other';
    } else {
      return labelName;
    }
  }
}

var startingCorrectHeight = horizontalHeight - 50;
var startingIncorrectHeight = horizontalHeight + 50;
var maxHeight = 180;
var xRowAdjustment = 50;
var heightBuffer = 10;

function getPathHeight(inputPath) {
  var placeholder = c.svg.append('path').at({
    d: scaleShapePath(inputPath, shapeScale),
  });
  var height = placeholder.node().getBBox().height;
  placeholder.remove();
  return height + heightBuffer;
}

// Figure out where to put the shapes for all possible placements
function generatePlacements() {
  for (selectionCriteria of data) {
    // starting X positions
    var nCategories = selectionCriteria.categories.length;
    var centerX = [];
    for (var i = 0; i < nCategories; i++) {
      var startingX = divWidth * ((i + 1) / (nCategories + 1));
      centerX.push(startingX);
      // Track where each label should be placed using a dictionary in the data
      selectionCriteria['textPlacements'][selectionCriteria.categories[i]] =
        startingX;
    }

    // For keeping of track of how we place items as we go
    var locationParams = {};
    for (categoryIdx in selectionCriteria.categories) {
      var categoryName = selectionCriteria.categories[categoryIdx];
      locationParams[categoryName] = {
        correctX: centerX[categoryIdx],
        incorrectX: centerX[categoryIdx],
        lastCorrectY: startingCorrectHeight,
        lastIncorrectY: startingIncorrectHeight,
      };
    }

    for (shape of shapeParams) {
      shapeCategory = getFinalCategory(
        shape[selectionCriteria.categoryName],
        selectionCriteria.isRounding,
      );
      var shapeHeight = getPathHeight(shape.path);
      var shapeX,
        shapeY = 0;
      if (shape.correctness == 'correct') {
        shapeY = locationParams[shapeCategory]['lastCorrectY'];
        shapeX = locationParams[shapeCategory]['correctX'];
        // Check if we've reached the maximum height
        if (
          startingCorrectHeight -
            locationParams[shapeCategory]['lastCorrectY'] >=
          maxHeight
        ) {
          // Reset height to baseline
          locationParams[shapeCategory]['lastCorrectY'] = startingCorrectHeight;
          // Move next row over
          locationParams[shapeCategory]['correctX'] =
            locationParams[shapeCategory]['correctX'] + xRowAdjustment;
        } else {
          locationParams[shapeCategory]['lastCorrectY'] += -1 * shapeHeight;
        }
      } else {
        shapeY = locationParams[shapeCategory]['lastIncorrectY'];
        shapeX = locationParams[shapeCategory]['incorrectX'];

        if (
          locationParams[shapeCategory]['lastIncorrectY'] -
            startingIncorrectHeight >=
          maxHeight
        ) {
          // Reset height to baseline
          locationParams[shapeCategory]['lastIncorrectY'] =
            startingIncorrectHeight;
          // Move next row over
          locationParams[shapeCategory]['incorrectX'] =
            locationParams[shapeCategory]['incorrectX'] + xRowAdjustment;
        } else {
          locationParams[shapeCategory]['lastIncorrectY'] += shapeHeight;
        }
      }
      shapeY = shapeY + getFineAdjustment(shape);
      shape[selectionCriteria.name + '_X'] = shapeX;
      shape[selectionCriteria.name + '_Y'] = shapeY;
    }
  }
}

generatePlacements();

function getLocation(shape) {
  return [shape[state.selected.name + '_X'], shape[state.selected.name + '_Y']];
}

function scaleShapePath(shapePath, factor = 0.5) {
  var newShapePath = '';
  for (var token of shapePath.split(' ')) {
    if (parseInt(token)) {
      newShapePath = newShapePath + parseInt(token) * factor;
    } else {
      newShapePath = newShapePath + token;
    }
    newShapePath = newShapePath + ' ';
  }
  return newShapePath;
}

// Add the shapes
var explainerShapeSel = c.svg
  .appendMany('path.shape', shapeParams)
  .at({
    d: (d) => scaleShapePath(d.path, shapeScale),
    class: (d) => 'gt-' + d.gt + ' ' + d.correctness,
  })
  .translate(function (d) {
    return getLocation(d);
  });

explainerShapeSel.classed('is-classified', true);

function getColor(d) {
  var scaleRowValue = d3.scaleLinear().domain([0.3, 1.0]).range([0, 1]);
  return d3.interpolateRdYlGn(scaleRowValue(d));
}

// Retrieve the results, for coloring the label boxes
function getResults() {
  return calculateResults(
    (property = state.selected.categoryName),
    (useGuess = state.selected.isRounding),
  );
}

function getCategoryAccuracy(results, category) {
  for (var key of results) {
    if (key.rawCategoryName == category) {
      return key.accuracy;
    }
  }
}

// Rename "large" and "rect"
function toExplainerDisplayString(categoryName) {
  if (categoryName == 'large') {
    return 'big';
  }
  if (categoryName == 'rect') {
    return 'rectangle';
  }
  return categoryName;
}

function getExplainerTextColor(d, i) {
  console.log(d == 'large');
  if (d == 'large' && state.selected.isRounding == false) {
    return '#ffccd8';
  } else {
    return '#000000';
  }
}

function updateText() {
  var explainerResults = getResults();

  d3.selectAll('.explainer-label-text').html('');
  d3.selectAll('.explainer-label-rect').remove();

  var rectHeight = 30;
  var rectWidth = 80;
  var textRect = c.svg
    .appendMany('rect.column-text-rect', state.selected.categories)
    .at({
      fill: (d) => getColor(getCategoryAccuracy(explainerResults, d)),
      height: rectHeight,
      width: rectWidth,
      class: 'explainer-label-rect',
    })
    .translate((d) => [
      state.selected.textPlacements[d] - rectWidth / 2,
      horizontalHeight - rectHeight / 2,
    ]);

  var text = c.svg
    .appendMany('text.column-text', state.selected.categories)
    .at({
      textAnchor: 'middle',
      dominantBaseline: 'central',
      class: 'explainer-label-text',
    })
    .st({
      fill: getExplainerTextColor,
    })
    .text((d) => toExplainerDisplayString(d))
    .translate((d) => [state.selected.textPlacements[d], horizontalHeight]);
}

function moveShapes() {
  explainerShapeSel
    .transition()
    .duration(500)
    .translate((d) => getLocation(d));
  updateText();
}

setActiveButton();
updateText();
