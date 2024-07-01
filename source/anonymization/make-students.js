window.makeStudents = function () {
  var seed = new Math.seedrandom('12fbsab56');
  var rand = d3.randomUniform.source(seed)(0, 1);

  var ncols = 12;

  var allStudents = d3.range(756).map((i) => {
    var age = ages[Math.floor(rand() * ages.length)];
    var state = states[Math.floor(rand() * states.length)];
    var season = Math.floor(rand() * 4);
    var heads = rand() < 0.5;

    if (rand() < 0.1) state = 'NY';
    if (rand() < 0.5 && state == 'RI')
      state = states[Math.floor(rand() * states.length)];
    if (rand() < 0.5 && state == 'CT')
      state = states[Math.floor(rand() * states.length)];

    var coinVals = d3.range(300).map(rand).slice(0, 200);

    return {
      age,
      state,
      i,
      pos: {},
      group: {},
      season,
      heads,
      coinVals,
      isAdditionalStudent: true,
    };
  });

  var students = allStudents.slice(0, 144);
  students.forEach((student) => (student.isAdditionalStudent = false));

  students.all = allStudents;
  students.all.forEach((d, i) => {
    var x = ((i % 25) / 25) * c.width;
    var y = (~~(i / 25) / 25) * c.width;
    d.pos.all = [x, y];
  });

  var {bw, ageScale, stateScale} = axii;
  _.sortBy(students, (d) => -d.age).forEach((d, i) => {
    var x = ((i % ncols) / (ncols - 1)) * c.width;
    var y = (~~(i / ncols) / (ncols - 1)) * c.width;
    d.pos.grid = [x, y];
    scale = 0.6;
    d.pos.smallGrid = [x * scale + 90, y * scale];
  });

  // Set half the student to have plagerized.
  var studentsPlagerizedArray = _.sortBy(
    d3.range(students.length).map((i) => i % 2 == 0),
    () => rand(),
  );
  // var remainingPlagerizedArray = _.sortBy(d3.range(allStudents.length - students.length).map(i => i % 2 == 0), () => rand())
  remainingPlagerizedArray = d3
    .range(students.all.length)
    .map((i) => i % 2 == 1);
  var plagerizedArray = studentsPlagerizedArray.concat(
    remainingPlagerizedArray,
  );
  students.all.forEach((d, i) => (d.plagerized = plagerizedArray[i]));

  students.byAge = d3.nestBy(students, (d) => d.age);
  students.byAge.forEach((age) => {
    age.forEach((d, i) => {
      d.pos.age = [i * 10, ageScale(d.age) + bw];
    });
  });
  students.byAgeState = d3.nestBy(students, (d) => d.age + d.state);
  students.byAgeState.forEach((group) => {
    var d0 = (group.d0 = group[0]);
    group.pos = [bw + stateScale(d0.state), bw + ageScale(d0.age)];

    var angle =
      Math.PI * (3 - Math.sqrt(5)) * (1 + Math.random() * 0.05 - 0.05 / 2);
    group.forEach((d, i) => {
      d.pos.ageState = addVec(phyllotaxis(i, 10.5, angle), group.pos);
      d.group.ageState = group;
    });
  });

  students.byAgeStateSeason = d3.nestBy(
    students,
    (d) => d.age + d.state + d.season,
  );
  students.byAgeStateSeason.forEach((group) => {
    var d0 = (group.d0 = group[0]);
    group.pos = [
      bw + stateScale(d0.state),
      (bw * d0.season) / 2 + ageScale(d0.age),
    ];

    group.forEach((d, i) => {
      d.pos.ageStateSeason = addVec(
        [i * 11 - (group.length * 11) / 2 + 6, 12],
        group.pos,
      );
      d.group.ageStateSeason = group;
    });
  });

  students.updateHeadsPos = function () {
    students.byHeads = d3.nestBy(
      students,
      (d) => d.coinVals[estimates.active.index] < sliders.headsProb,
    );
    students.byHeads.forEach((group) => {
      group.pos = [
        group.key == 'true' ? c.width / 4 - 15 : (c.width / 4) * 3 + 15,
        c.height / 2,
      ];

      group.forEach((d, i) => {
        d.pos.heads = addVec(phyllotaxis(i, 12), group.pos);
        d.group.heads = group;
      });
    });
  };

  students.plagerizedGroup = d3.nestBy(
    _.sortBy(students.all, (d) => d.plagerized),
    (d) => d.plagerized,
  );
  students.plagerizedGroup.forEach((group, groupIndex) => {
    var d0 = (group.d0 = group[0]);
    var offset = -20;
    group.pos = [
      d0.plagerized ? c.width / 2 + offset : c.width / 2 - offset,
      c.height / 2 - 80,
    ];

    var getOrderedPositions = function () {
      positions = [];

      var step = 25;
      var top = 0;
      var bottom = 0;
      var right = 0;

      var addAbove = function (dirPositive = true) {
        var y = (top + 1) * step;
        var x = 0;
        while (x <= right * step) {
          positions.push([dirPositive ? x : right * step - x, y]);
          x += step;
        }
        top++;
      };

      var addRight = function (dirPositive = true) {
        var x = (right + 1) * step;
        var y = bottom * step;
        while (y <= top * step) {
          positions.push([x, dirPositive ? y : -y]);
          y += step;
        }
        right++;
      };

      var addBelow = function (dirPositive = true) {
        var y = (bottom - 1) * step;
        var x = 0;
        while (x <= right * step) {
          positions.push([dirPositive ? x : right * step - x, y]);
          x += step;
        }
        bottom--;
      };

      var addForward = function () {
        addAbove(true);
        addRight(false);
        addBelow(false);
      };

      var addBackward = function () {
        addBelow(true);
        addRight(true);
        addAbove(false);
      };

      isForward = true;
      while (positions.length < students.all.length) {
        if (positions.length === 0) {
          positions.push([0, 0]);
          addRight();
          addBelow();
        } else {
          if (isForward) {
            addForward();
          } else {
            addBackward();
          }
          isForward = !isForward;
        }
      }
      return positions;
    };

    var populationPositions = getOrderedPositions();
    var reversePositions = populationPositions.map((pos) => [-pos[0], pos[1]]);

    group.forEach((d, i) => {
      var x = ((i % 7) / 20) * c.width;
      var y = (~~(i / 7) / 20) * c.width;
      // d.pos.plagerized = addVec([x, y], group.pos)
      d.pos.plagerizedShifted = addVec([x, y - 50], group.pos);
      d.group.plagerized = group;

      d.pos.plagerizedShifted = addVec(
        groupIndex === 0 ? populationPositions[i] : reversePositions[i],
        group.pos,
      );
    });
  });

  students.rand = rand;
  return students;
};

if (window.init) window.init();
