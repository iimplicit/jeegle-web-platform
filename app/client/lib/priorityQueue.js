function Node(data, priority, tag){
  this.data = data;
  this.priority = priority;
  this.tag = tag;
}
// What's wrong with you?
// Node.prototype.getPriority = function(){return this.priority;}
Node.prototype.toString = function(){return this.priority;}

priorityQueue = function (maxSize){
  this.heap = [];
  this.maxSize = maxSize;
}

// We assume priority == score. it means that data with lower score will pop
priorityQueue.prototype = {

  push: function(data, priority, tag) {
    if(this.heap.length==this.maxSize){
        console.log('we are full queue now. pop: '+this.pop());
    };
    var node = new Node(data, priority, tag); //create node
    var i = this.heap.push(node) //it will return last index of heap
    this.bubble(i-1)
  },
  pop: function() {
    var topVal = this.heap[0].data;
    //we don't need to deal with no data.
    this.heap[0] = this.heap.pop(); //get last value
    this.sink(0);
    return topVal;
  },
  bubble: function(i){
    while(i>0){
      var parentIndex = (i-1) >> 1;

      if(!this.higherPriority(i, parentIndex)) break;

      this.swap(i, parentIndex);
      i = parentIndex;
    }
  },
  sink: function(i){
    while((i*2)+1 < this.heap.length){
      var leftChildIndex = (i*2)+1;
      var childIndex = 0;

      if(leftChildIndex+1 == this.heap.length){
        // if there is only leftChild
        childIndex = leftChildIndex;
      }else{
        // there are both left and right child
        var leftHigher = this.higherPriority(leftChildIndex, leftChildIndex+1);
        childIndex = leftHigher? leftChildIndex : leftChildIndex+1;
      }

      if (this.higherPriority(i,childIndex)) break;

      this.swap(i, childIndex);
      i = childIndex;
    }
  },
  swap: function(i, j){
    var temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;

    /*
    // swap without temp. But is it efficient enough?
    this.heap[i] = this.heap[i] + this.heap[j]
    this.heap[j] = this.heap[i] - this.heap[j]
    this.heap[i] = this.heap[i] - this.heap[j]
    */
  },
  higherPriority: function(i, j){
    return this.heap[i].priority <= this.heap[j].priority
  }
}

// queue = new priorityQueue(10);
//
// queue.push({p:'two'}, 2);
// queue.push({p:'three'}, 3);
// queue.push({p:'five'}, 5);
// queue.push({p:'1st one'}, 1);
// queue.push({p:'zero'}, 0);
// queue.push({p:'nine'}, 9);
// queue.push({p:'2nd one'}, 1);
// queue.push({p:'one-half'}, 0.5);
// console.log(queue.heap.toString()); // => 0,1,1,3,2,9,5
