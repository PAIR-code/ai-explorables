console.clear()

tf.setBackend('cpu')


async function train(dataset, numEpochs){
  const {xTrainTensor, yTrainTensor} = dataset

  const weights = [
    tf.variable(tf.randomNormal([2, 4])),
    tf.variable(tf.randomNormal([4])),
    tf.variable(tf.randomNormal([4, 1])),
    tf.variable(tf.randomNormal([1]))
  ]    
  window.weights = weights

  // const w1 = weights[0].clone()
  // const b1 = weights[1].clone()
  // const w2 = weights[2].clone()
  // const b2 = weights[3]//.clone()// clone throws an error for a [1] tensor?

  const w1 = sliceCopy(weights[0])
  const b1 = sliceCopy(weights[1])
  const w2 = sliceCopy(weights[2])
  const b2 = sliceCopy(weights[3])

  function sliceCopy(x){
    return tf.variable(tf.tensor(x.dataSync().slice(), x.shape))
  }
 
  function model(x){
    return x.matMul(w1).add(b1).tanh().matMul(w2).add(b2).tanh()
  }

  const optimizer = tf.train.sgd(.3)
  for (let epoch = 0; epoch < numEpochs; epoch++){
    optimizer.minimize(() => {
      const predYs = model(xTrainTensor)
      const loss = tf.losses.meanSquaredError(yTrainTensor, predYs)
      // console.log('losss')
      return loss
    })
  }

  return {predict: model, weights: [w1, b1, w2, b2]}
}


async function main(sel, modelIndex){
  const dataset = util.genDataDiagonal(modelIndex)
  let model = await train(dataset, 40)
  await util.initChart(model, dataset, sel)
}


window.init = function(){
  d3.select('.graph').html('')
    .appendMany('div.col', d3.range(10))
    .each(function(i){
      main(d3.select(this), i)
    })
}
window.init()



function sliceCopy(x){
  return tf.variable(tf.tensor(x.dataSync().slice(), x.shape))
}