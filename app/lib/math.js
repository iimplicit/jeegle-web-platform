Math.getRandom = function(min, max) {
  if (min == null) {
    min = 0;
  }
  if (max == null) {
    max = 1000;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
