model.weights.forEach(w => {
 console.log(w.name, w.shape, w);
})

model.weights.forEach(w => {
  const newVals = tf.randomNormal(w.shape);
  // w.val is an instance of tf.Variable
  w.val.assign(newVals);
})

model.summary()
