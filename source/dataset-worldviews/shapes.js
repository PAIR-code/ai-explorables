// Space out the shapes a bit
shapeParams.forEach((d) => (d.startX = d.startX * 1.1));

// How to draw the background boxes, which will be styled later
const classifierBgPathTop = 'M 420 150 H 0 V 0 H 420 V 150';
const classifierBgPathBottom = 'M 420 300 H 0 V 0 H 420 V 300';

const toDropdownValueStringDict = {
  shape_name: 'circles, triangles, or rectangles',
  pointiness: 'pointy shapes or round shapes',
  size: 'small shapes or big shapes',
};

const toShortValueStringDict = {
  shape_name: 'circles, triangles, or rectangles',
  pointiness: 'pointy or round',
  size: 'small or big',
};

const toDropdownValueRoundingStringDict = {
  true: 'with our best guess',
  false: 'as "other"',
};

const toPropertyStringDict = {
  pointy: 'pointy shapes',
  round: 'round shapes',
  small: 'small shapes',
  large: 'big shapes',
  circle: 'circles',
  triangle: 'triangles',
  rect: 'rectangles',
};

function toOriginalString(inputString) {
  for (const [key, value] of Object.entries(toPropertyStringDict)) {
    if (inputString == value) {
      return key;
    }
  }
}

function toPropertyString(inputProperty, isRounding = true) {
  if (!isRounding && inputProperty.startsWith('rt_')) {
    return 'others';
  }
  return toPropertyStringDict[inputProperty.replace('rt_', '')];
}

// Dictionary mapping div name to classifier results and summary sentences
var allResults = {};
var summaries = {};

function toBool(inputString) {
  if (inputString == 'true') {
    return true;
  }
  return false;
}
function updateResults() {
  allResults['default-classifier'] = calculateResults();
  allResults['second-classifier'] = calculateResults(
    'shape_name',
    toBool(document.getElementById('second-classifier-select-rounding').value),
  );

  allResults['final-classifier'] = calculateResults(
    document.getElementById('final-classifier-select-category').value,
    toBool(document.getElementById('final-classifier-select-rounding').value),
  );

  allResults['conclusion'] = calculateResults(
    document.getElementById('conclusion-select-category').value,
    true,
  );

  updateSummaries();
  updateSecondInterfaceImages();
}

// Text summaries are written by hand for simplicity, and keyed simply by
// a string of the form "[category]:[useGuess]" (or simply "none").
// These are hashed in the same way as the results, by div name.
function updateSummaries() {
  summaries['default-classifier'] = getPerformanceSummary('none');
  summaries['second-classifier'] = getPerformanceSummary(
    'shape_name:' +
      document.getElementById('second-classifier-select-rounding').value,
  );

  summaries['final-classifier'] = getPerformanceSummary(
    document.getElementById('final-classifier-select-category').value +
      ':' +
      document.getElementById('final-classifier-select-rounding').value,
  );

  summaries['conclusion'] = getPerformanceSummary(
    document.getElementById('conclusion-select-category').value + ':' + true,
  );
}

// Yes, these background colors are hardcoded in,
// no, this is not good design, this is just how it happened.
function getPerformanceSummary(key) {
  allSummaries = {
    'shape_name:true':
      '<mark style="background-color: rgb(206, 234, 135);" class="well">well</mark> on circles, <mark style="background-color: rgb(244, 123, 74);" class="terribly">terribly</mark> on triangles, and <mark style="background-color: rgb(173, 220, 114);" class="best">best</mark> on rectangles',
    'shape_name:false':
      '<mark style="background-color: rgb(251, 163, 94);" class="poorly">poorly</mark> on circles, <mark style="background-color: rgb(155, 212, 108);" class="best">best</mark> on triangles and rectangles, and <mark style="background-color: rgb(252, 244, 171);" class="fine">fine</mark> on other shapes',
    'pointiness:true':
      '<mark style="background-color: rgb(184, 225, 119);" class="better">better</mark> on pointy shapes and <mark style="background-color: rgb(254, 206, 125);" class="worse">worse</mark> on round shapes',
    'pointiness:false':
      '<mark style="background-color: rgb(140, 205, 104);" class="best">best</mark> on pointy shapes, <mark style="background-color: rgb(243, 248, 171);" class="fine">fine</mark> on round shapes, and <mark style="background-color: rgb(253, 190, 111);" class="poorly">poorly</mark> on other shapes',
    'size:true':
      '<mark style="background-color: rgb(206, 234, 135);" class="better">better</mark> on small shapes, <mark style="background-color: rgb(254, 232, 154);" class="worse">worse</mark> on big shapes',
    'size:false':
      '<mark style="background-color: rgb(254, 215, 135);" class="poorly">poorly</mark> on small shapes, <mark style="background-color: rgb(165, 0, 38); color: #FFCCD8;" class="terribly">terribly</mark> on big shapes, and <mark style="background-color: rgb(110, 192, 99);" class="best">best</mark> on other shapes',
    'none:true':
      '<mark style="background-color: rgb(246, 248, 173);" class="fine">fine</mark> on all shapes',
    'none:false':
      '<mark style="background-color: rgb(246, 248, 173);" class="fine">fine</mark> on all shapes',
    none: '<mark style="background-color: rgb(246, 248, 173);" class="fine">fine</mark> on all shapes',
  };

  return 'The Is-Shaded Classifier performs ' + allSummaries[key] + '.';
}

// On the second-classifier dropdown, update the "task interface" image.
function updateSecondInterfaceImages() {
  d3.select('.second-interface').html(function () {
    if (!document.getElementById('second-classifier-select-rounding').value) {
      return;
    }
    var imgPath =
      'img/interface_shape_name_' +
      document.getElementById('second-classifier-select-rounding').value;
    return (
      '<img src="' +
      imgPath +
      '.png" alt="" class="interface-image" srcset="' +
      imgPath +
      '.svg"></img>'
    );
  });
}

// Calculate results given input parameters
function calculateResults(property = 'none', useGuess = false) {
  switch (property) {
    case 'none':
      var nAccurate = shapeParams.filter(
        (shape) => shape.correctness == 'correct',
      ).length;
      var totalShapes = shapeParams.length;

      var results = [
        {
          object: 'shape',
          n: totalShapes,
          'n correct': nAccurate,
          accuracy: (nAccurate / totalShapes).toFixed(3),
          rawCategoryName: 'none',
        },
      ];

      return results;
    case 'pointiness':
      categories = ['pointy', 'round'];
      break;
    case 'size':
      categories = ['small', 'large'];
      break;
    case 'shape_name':
      categories = ['circle', 'triangle', 'rect'];
      break;
  }

  var results = [];
  if (useGuess == true) {
    // Rounding shapes to categories

    for (const category of categories) {
      // Get shapes that are either in this category (e.g. rectangle) or "rounds to" this category (e.g. rt_rectangle)
      var theseShapes = shapeParams.filter(
        (shape) =>
          shape[property] == category || shape[property] == 'rt_' + category,
      );
      var nAccurate = theseShapes.filter(
        (shape) => shape.correctness == 'correct',
      ).length;
      var totalShapes = theseShapes.length;

      results.push({
        object: toPropertyString(category),
        n: totalShapes,
        'n correct': nAccurate,
        accuracy: (nAccurate / totalShapes).toFixed(3),
        rawCategoryName: category,
      });
    }
  } else {
    // Not rounding, treat everything else as "other"

    // First go through existing categories
    for (const category of categories) {
      var theseShapes = shapeParams.filter(
        (shape) => shape[property] == category,
      );
      var nAccurate = theseShapes.filter(
        (shape) => shape.correctness == 'correct',
      ).length;
      var totalShapes = theseShapes.length;
      results.push({
        object: toPropertyString(category),
        n: totalShapes,
        'n correct': nAccurate,
        accuracy: (nAccurate / totalShapes).toFixed(3),
        rawCategoryName: category,
      });
    }

    // Now get "other" shapes
    var theseShapes = shapeParams.filter(
      (shape) => !categories.includes(shape[property]),
    );
    var nAccurate = theseShapes.filter(
      (shape) => shape.correctness == 'correct',
    ).length;
    var totalShapes = theseShapes.length;
    results.push({
      object: 'other shapes',
      n: totalShapes,
      'n correct': nAccurate,
      accuracy: (nAccurate / totalShapes).toFixed(3),
      rawCategoryName: 'other',
    });
  }

  return results;
}
