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



window.makeStudents = function(){
  var seed = new Math.seedrandom('he4a15')
  var rand = d3.randomUniform.source(seed)(0, 1)
  var letters = 'abcdefgijlmnopqrsuvwxyz'
  letters = (letters + letters.toUpperCase()).split('')

  var nSickCols = 6
  var mSickCols = 8
  var fSickCols = nSickCols*2 - mSickCols

  var students = d3.range(nCols*nCols).map(i => {
    var letter = letters[~~d3.randomUniform.source(seed)(0, letters.length)()]

    var isMale = i % 2 == 0
    var isSick = i < (isMale ? mSickCols : fSickCols)*nCols
    var grade = isSick*.5 + rand()
    var pos = {}

    return {letter, isSick, isMale, grade, pos}
  })

  students = _.sortBy(students, d => -d.grade)
  d3.nestBy(students, d => d.isSick).forEach(group => {
    var isSick = group[0].isSick

    var sickCols = nSickCols
    var cols = isSick ? sickCols : nCols - sickCols
    var xOffset = isSick ? 0 : sickCols

    group.forEach((d, i) => {
      d.pos.allIJ = [cols - 1 - (i % cols) + xOffset, ~~(i/cols)]
      var spreadIJ = d.pos.allIJ.slice()
      if (!d.isSick) spreadIJ[0] += .1
      d.pos.all = spreadIJ.map(d => d*c.width/10)
    })
  })

  d3.nestBy(students, d => d.isSick + '-' + d.isMale).forEach(group => {
    var isSick = group[0].isSick
    var isMale = group[0].isMale

    var sickCols = isMale ? mSickCols : fSickCols
    var cols = isSick ? sickCols : nCols - sickCols
    var xOffset = isSick ? 0 : sickCols
    var yOffset = isMale ? nCols/2 + 2 : 0

    group.forEach((d, i) => {
      d.pos.sexIJ = [cols - 1 - (i % cols) + xOffset, ~~(i/cols) + yOffset]
      d.pos.sexGroupIJ = [cols - 1 - (i % cols) + xOffset, ~~(i/cols)]
      var spreadIJ = d.pos.sexIJ.slice()
      if (!d.isSick) spreadIJ[0] += .1
      d.pos.sex = spreadIJ.map(d => d*c.width/10)
    })
  })

  students.maleOffsetJ = nCols/2 + 2
  students.maleOffsetPx= students.maleOffsetJ*c.width/10

  students.fSickCols = fSickCols
  students.mSickCols = mSickCols

  students.colWidth = c.width/10

  students.rand = rand
  return students
}






if (window.init) window.init()
