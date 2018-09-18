import { Matrix, Vector } from 'sylvester';

Matrix.Translation = function (v) {
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}

Matrix.prototype.flatten = function () {
  let result = [];
  if (this.elements.length == 0)
    return [];

  for (var j = 0; j < this.elements[0].length; j++)
    for (var i = 0; i < this.elements.length; i++)
      result.push(this.elements[i][j]);
  return result;
};

Matrix.prototype.ensure4x4 = function () {
  if (this.elements.length == 4 &&
    this.elements[0].length == 4)
    return this;

  if (this.elements.length > 4 ||
    this.elements[0].length > 4)
    return null;

  for (let i = 0; i < this.elements.length; i++) {
    for (let j = this.elements[i].length; j < 4; j++) {
      if (i == j)
        this.elements[i].push(1);
      else
        this.elements[i].push(0);
    }
  }

  for (let i = this.elements.length; i < 4; i++) {
    if (i == 0)
      this.elements.push([1, 0, 0, 0]);
    else if (i == 1)
      this.elements.push([0, 1, 0, 0]);
    else if (i == 2)
      this.elements.push([0, 0, 1, 0]);
    else if (i == 3)
      this.elements.push([0, 0, 0, 1]);
  }

  return this;
};

Matrix.prototype.make3x3 = function () {
  if (this.elements.length != 4 ||
    this.elements[0].length != 4)
    return null;

  return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
  [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
  [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};

Vector.prototype.ensure3 = function () {
  return Vector.create([this.elements[0], this.elements[1], this.elements[2]]);
};

Vector.prototype.ensure4 = function (w) {
  return Vector.create([this.elements[0], this.elements[1], this.elements[2], w]);
};

Vector.prototype.divideByW = function () {
  var w = this.elements[this.elements.length - 1];
  var newElements = [];
  for (var i = 0; i < this.elements.length; i++) {
    newElements.push(this.elements[i] / w);
  }
  return Vector.create(newElements);
};

Vector.prototype.componentDivide = function (vector) {
  if (this.elements.length != vector.elements.length) {
    return null;
  }
  var newElements = [];
  for (var i = 0; i < this.elements.length; i++) {
    newElements.push(this.elements[i] / vector.elements[i]);
  }
  return Vector.create(newElements);
};

Vector.min = function (a, b) {
  if (a.elements.length != b.elements.length) {
    return null;
  }
  var newElements = [];
  for (var i = 0; i < a.elements.length; i++) {
    newElements.push(Math.min(a.elements[i], b.elements[i]));
  }
  return Vector.create(newElements);
};

Vector.max = function (a, b) {
  if (a.elements.length != b.elements.length) {
    return null;
  }
  var newElements = [];
  for (var i = 0; i < a.elements.length; i++) {
    newElements.push(Math.max(a.elements[i], b.elements[i]));
  }
  return Vector.create(newElements);
};

Vector.prototype.minComponent = function () {
  var value = Number.MAX_VALUE;
  for (var i = 0; i < this.elements.length; i++) {
    value = Math.min(value, this.elements[i]);
  }
  return value;
};

Vector.prototype.maxComponent = function () {
  var value = -Number.MAX_VALUE;
  for (var i = 0; i < this.elements.length; i++) {
    value = Math.max(value, this.elements[i]);
  }
  return value;
};

export function isPowerOf2(value: number) {
  return (value & (value - 1)) == 0;
}